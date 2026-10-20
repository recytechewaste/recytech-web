const User = require('../models/User');
const Resident = require('../models/Resident');
const PartnerOrganization = require('../models/PartnerOrganization');
const Collector = require('../models/Collector');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail, sendAccountApprovedEmail } = require('../services/emailService');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');
const { assertUniqueCollectorFields, formatPlateForStorage } = require('../utils/collectorUniqueness');
const { logAuditEvent } = require('../utils/auditLogger');

const getUsers = asyncHandler(async (req, res) => {
    const { includeAll } = req.query;
    let query = {};

    // By default, User Management only displays system/admin/staff users.
    // Mobile actors (household, collector, partner_org) have their own dedicated management pages.
    if (includeAll !== 'true') {
        query = { role: { $in: ['Staff', 'Admin', 'Super Admin'] } };
    }
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 });
        
    res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, status } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please enter all required fields: First Name, Last Name, Email, Password, and Role');
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const normalizedEmail = email.toLowerCase().trim();

    const requesterRole = normalizeRole(req.user.role);
    const targetRole = normalizeRole(role || 'Staff');

    // Hierarchy check: Only Super Admin can create Admin or Super Admin accounts
    if ([CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.SUPER_ADMIN].includes(targetRole) && requesterRole !== CANONICAL_ROLES.SUPER_ADMIN) {
        res.status(403);
        throw new Error('Forbidden: Only Super Administrators can provision Administrator or Super Administrator accounts.');
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    const orgExists = await PartnerOrganization.findOne({ email: normalizedEmail });
    if (userExists || orgExists) {
        res.status(400);
        throw new Error('An account with that email address already exists in the system.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: targetRole,
        status: status || 'Active'
    });

    if (user) {
        try {
            // Send the welcome email with instructions to use the Forgot Password flow
            await sendWelcomeEmail(email, firstName, role);
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }

        await logAuditEvent({
            req,
            action: 'USER_CREATED',
            actionCategory: 'USER_MANAGEMENT',
            targetEntity: { entityType: 'User', entityId: user._id.toString(), name: `${user.firstName} ${user.lastName}` },
            details: { email: user.email, role: user.role, status: user.status }
        });

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const updateUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const requesterRole = normalizeRole(req.user.role);
    const targetUserCurrentRole = normalizeRole(user.role);
    const newRole = role ? normalizeRole(role) : targetUserCurrentRole;

    // 1. Target user is Super Admin: Only Super Admin can modify
    if (targetUserCurrentRole === CANONICAL_ROLES.SUPER_ADMIN && requesterRole !== CANONICAL_ROLES.SUPER_ADMIN) {
        res.status(403);
        throw new Error('Forbidden: Standard Administrators cannot modify a Super Administrator account.');
    }

    // 2. Target user is Admin: Standard Admin cannot modify other Admins
    if (targetUserCurrentRole === CANONICAL_ROLES.ADMIN && requesterRole !== CANONICAL_ROLES.SUPER_ADMIN && user._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Forbidden: Standard Administrators cannot modify other Administrator accounts.');
    }

    // 3. Role promotion or demotion to/from Admin/Super Admin requires Super Admin
    if ((newRole === CANONICAL_ROLES.SUPER_ADMIN || newRole === CANONICAL_ROLES.ADMIN || targetUserCurrentRole === CANONICAL_ROLES.ADMIN) && requesterRole !== CANONICAL_ROLES.SUPER_ADMIN) {
        if (newRole !== targetUserCurrentRole) {
            res.status(403);
            throw new Error('Forbidden: Only Super Administrators can assign or change Administrator roles.');
        }
    }

    const wasInactive = !user.status || ['inactive', 'pending'].includes(user.status.toLowerCase());
    const isNowActive = Boolean(status && status.toLowerCase() === 'active');

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.role = newRole;
    user.status = status || user.status;

    const updatedUser = await user.save();

        // If the admin just approved an inactive account, send them the good news!
        if (wasInactive && isNowActive) {
            try {
                await sendAccountApprovedEmail(updatedUser.email, updatedUser.firstName);
            } catch (err) {
                console.error('Failed to send account approval email:', err);
            }
        }

        await logAuditEvent({
            req,
            action: newRole !== targetUserCurrentRole ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
            actionCategory: newRole !== targetUserCurrentRole ? 'ACCESS_CONTROL' : 'USER_MANAGEMENT',
            targetEntity: { entityType: 'User', entityId: updatedUser._id.toString(), name: `${updatedUser.firstName} ${updatedUser.lastName}` },
            details: { previousRole: targetUserCurrentRole, newRole: updatedUser.role, status: updatedUser.status }
        });

    res.status(200).json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    // Prevent users from deleting themselves
    if (req.params.id === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot delete your own currently logged-in account.');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    const requesterRole = normalizeRole(req.user.role);
    const targetRole = normalizeRole(user.role);

    // Standard Admin CANNOT delete or deactivate an Admin or Super Admin
    if ([CANONICAL_ROLES.SUPER_ADMIN, CANONICAL_ROLES.ADMIN].includes(targetRole) && requesterRole !== CANONICAL_ROLES.SUPER_ADMIN) {
        res.status(403);
        throw new Error('Forbidden: Only Super Administrators can deactivate Administrator or Super Administrator accounts.');
    }

    // Protect against deactivating the last active Super Admin
    if (targetRole === CANONICAL_ROLES.SUPER_ADMIN) {
        const activeSuperAdmins = await User.countDocuments({
            role: { $in: ['Super Admin', 'super_admin', 'superadmin'] },
            status: 'Active',
            _id: { $ne: user._id }
        });
        if (activeSuperAdmins === 0) {
            res.status(400);
            throw new Error("Action blocked: Cannot deactivate the system's only active Super Administrator.");
        }
    }
    
    // Soft-delete the user by setting their status to Inactive
    user.status = 'Inactive';
    await user.save();

    await logAuditEvent({
        req,
        action: 'USER_DEACTIVATED',
        actionCategory: 'ACCESS_CONTROL',
        targetEntity: { entityType: 'User', entityId: user._id.toString(), name: `${user.firstName} ${user.lastName}` },
        details: { email: user.email, role: user.role }
    });
    res.json({ message: 'User has been deactivated successfully.' });
});

// @desc    Get logged in user profile with linked role profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('User profile not found');
    }

    const { profileId, profileType, profile } = await getProfileForUser(user._id, user.role);

    const normalizedAccountStatus = (user.status || 'Active').toLowerCase();

    res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: normalizeRole(user.role),
        status: user.status,
        accountStatus: normalizedAccountStatus,
        profileId,
        profileType,
        profile,
        user
    });
});

// @desc    Update logged in user profile & sync role profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User profile not found');
    }

    if (req.body.firstName !== undefined) {
        const trimmedFirst = req.body.firstName.trim();
        if (!trimmedFirst || trimmedFirst.length < 2) {
            res.status(400);
            throw new Error('First name must be at least 2 characters');
        }
        if (trimmedFirst.length > 50) {
            res.status(400);
            throw new Error('First name cannot exceed 50 characters');
        }
        const nameRegex = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/;
        if (!nameRegex.test(trimmedFirst)) {
            res.status(400);
            throw new Error('First name can only contain letters, spaces, hyphens, and apostrophes');
        }
        user.firstName = trimmedFirst;
    }

    if (req.body.lastName !== undefined) {
        const trimmedLast = req.body.lastName.trim();
        if (!trimmedLast || trimmedLast.length < 2) {
            res.status(400);
            throw new Error('Last name must be at least 2 characters');
        }
        if (trimmedLast.length > 50) {
            res.status(400);
            throw new Error('Last name cannot exceed 50 characters');
        }
        const nameRegex = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/;
        if (!nameRegex.test(trimmedLast)) {
            res.status(400);
            throw new Error('Last name can only contain letters, spaces, hyphens, and apostrophes');
        }
        user.lastName = trimmedLast;
    }

    if (req.body.password) {
        // Security: a password change must always be verified with the current password
        const { currentPassword } = req.body;
        if (!currentPassword) {
            res.status(400);
            throw new Error('Current password is required to change your password');
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400);
            throw new Error('Invalid current password');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
            res.status(400);
            throw new Error('Password must be at least 8 characters, including upper, lower, number, and special character');
        }
        if (await bcrypt.compare(req.body.password, user.password)) {
            res.status(400);
            throw new Error('New password must be different from your current password');
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Collectors: validate unique phone / vehicle plate BEFORE saving anything
    if (normalizeRole(user.role) === CANONICAL_ROLES.COLLECTOR) {
        const newPhone = req.body.phone ?? req.body.contactNumber;
        const newPlate = req.body.vehiclePlate ?? req.body.assignedVehiclePlate;
        if (newPhone !== undefined || newPlate !== undefined) {
            const ownCollector = await Collector.findOne({ user: user._id }).select('_id').lean();
            await assertUniqueCollectorFields({
                phone: newPhone,
                vehiclePlate: newPlate,
                excludeId: ownCollector?._id
            }, res);
        }
    }

    const updatedUser = await user.save();

    // Synchronize linked role profile
    const canonicalRole = normalizeRole(user.role);
    let updatedProfile = null;

    if (canonicalRole === CANONICAL_ROLES.HOUSEHOLD) {
        let resident = await Resident.findOne({ user: user._id });
        if (!resident) {
            resident = await Resident.findOne({ email: user.email });
            if (resident) {
                resident.user = user._id;
            }
        }
        if (resident) {
            if (req.body.firstName !== undefined) resident.firstName = user.firstName;
            if (req.body.lastName !== undefined) resident.lastName = user.lastName;
            if (req.body.phone !== undefined) resident.phone = req.body.phone;
            if (req.body.address !== undefined) resident.address = req.body.address;
            if (req.body.password) resident.password = user.password;
            updatedProfile = await resident.save();
        }
    } else if (canonicalRole === CANONICAL_ROLES.PARTNER_ORG) {
        let partnerOrg = await PartnerOrganization.findOne({ user: user._id });
        if (!partnerOrg) {
            partnerOrg = await PartnerOrganization.findOne({ email: user.email });
            if (partnerOrg) {
                partnerOrg.user = user._id;
            }
        }
        if (partnerOrg) {
            if (req.body.name !== undefined) partnerOrg.name = req.body.name;
            if (req.body.organizationName !== undefined) partnerOrg.name = req.body.organizationName;
            if (req.body.contactPerson !== undefined) partnerOrg.contactPerson = req.body.contactPerson;
            if (req.body.contactNumber !== undefined) partnerOrg.phone = req.body.contactNumber;
            if (req.body.phone !== undefined) partnerOrg.phone = req.body.phone;
            if (req.body.jurisdiction !== undefined) partnerOrg.jurisdiction = req.body.jurisdiction;
            if (req.body.address !== undefined) partnerOrg.jurisdiction = req.body.address;
            updatedProfile = await partnerOrg.save();
        }
    } else if (canonicalRole === CANONICAL_ROLES.COLLECTOR) {
        let collector = await Collector.findOne({ user: user._id });
        if (!collector) {
            collector = await Collector.findOne({ email: user.email });
            if (collector) {
                collector.user = user._id;
            }
        }
        if (collector) {
            if (req.body.firstName !== undefined) collector.firstName = user.firstName;
            if (req.body.lastName !== undefined) collector.lastName = user.lastName;
            if (req.body.phone !== undefined) collector.phone = req.body.phone;
            if (req.body.contactNumber !== undefined) collector.phone = req.body.contactNumber;
            if (req.body.vehiclePlate !== undefined) collector.vehiclePlate = formatPlateForStorage(req.body.vehiclePlate);
            if (req.body.assignedVehiclePlate !== undefined) collector.vehiclePlate = formatPlateForStorage(req.body.assignedVehiclePlate);
            if (req.body.vehicleType !== undefined) collector.vehicleType = req.body.vehicleType;
            updatedProfile = await collector.save();
        }
    }

    res.json({
        message: 'Profile updated successfully',
        user: {
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: normalizeRole(updatedUser.role),
            status: updatedUser.status
        },
        profile: updatedProfile
    });
});

// @desc    Change logged-in user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }

    if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid current password');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters, including upper, lower, number, and special character');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
        res.status(400);
        throw new Error('New password must be different from your current password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await logAuditEvent({
        req,
        action: 'PASSWORD_CHANGED',
        actionCategory: 'SECURITY',
        targetEntity: { entityType: 'User', entityId: user._id.toString(), name: `${user.firstName} ${user.lastName}` },
        details: { email: user.email, note: 'Password changed with current password verification' }
    });

    // Also sync password if Resident has separate password field
    const resident = await Resident.findOne({ user: user._id });
    if (resident) {
        resident.password = hashedPassword;
        await resident.save();
    }

    res.json({
        message: 'Password changed successfully'
    });
});

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    changePassword
};