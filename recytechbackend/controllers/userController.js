const User = require('../models/User');
const Resident = require('../models/Resident');
const PartnerOrganization = require('../models/PartnerOrganization');
const Collector = require('../models/Collector');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail, sendAccountApprovedEmail } = require('../services/emailService');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');

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

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with that email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        status: status || 'Active'
    });

    if (user) {
        try {
            // Send the welcome email with instructions to use the Forgot Password flow
            await sendWelcomeEmail(email, firstName, role);
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }

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

    if (user) {
        const wasInactive = user.status === 'Inactive';
        const isNowActive = status === 'Active';

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.role = role || user.role;
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

        res.status(200).json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
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
    
    // Soft-delete the user by setting their status to Inactive
    user.status = 'Inactive';
    await user.save();
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

    res.json({
        user,
        role: normalizeRole(user.role),
        status: user.status,
        profileId,
        profileType,
        profile
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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
            res.status(400);
            throw new Error('Password must be at least 8 characters, including upper, lower, number, and special character');
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
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
            if (req.body.vehiclePlate !== undefined) collector.vehiclePlate = req.body.vehiclePlate;
            if (req.body.assignedVehiclePlate !== undefined) collector.vehiclePlate = req.body.assignedVehiclePlate;
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

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