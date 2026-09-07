const User = require('../models/User');
const Resident = require('../models/Resident');
const PartnerOrganization = require('../models/PartnerOrganization');
const Collector = require('../models/Collector');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AUTH_CONSTANTS } = require('../config/constants');
const { sendPinEmail } = require('../services/emailService');
const { asyncHandler } = require('../utils/asyncHandler');

const generateToken = (res, id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN });
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Uses HTTPS in production
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'strict', // Allows cross-site cookies in production
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
    return token; // Return token so it can be included in the response body
};
const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
        if (['Inactive', 'Disabled', 'Rejected', 'inactive', 'disabled', 'rejected'].includes(user.status)) {
            res.status(403);
            throw new Error('Account is deactivated. Please contact your Super Admin.');
        }

        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(res, user._id);

        // Lookup linked domain profile ID
        let profileId = null;
        if (['household', 'resident', 'Resident', 'User'].includes(user.role)) {
            const resProfile = await Resident.findOne({ user: user._id });
            if (resProfile) profileId = resProfile._id;
        } else if (['partner_org', 'partner_organization', 'LGU', 'Partner Organization', 'PartnerOrganization'].includes(user.role)) {
            const partProfile = await PartnerOrganization.findOne({ user: user._id });
            if (partProfile) profileId = partProfile._id;
        } else if (['collector', 'Collector'].includes(user.role)) {
            const collProfile = await Collector.findOne({ user: user._id });
            if (collProfile) profileId = collProfile._id;
        }

        const userPayload = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status
        };

        // Return unified auth envelope along with root fields for full backward compatibility
        res.json({
            ...userPayload,
            profileId,
            token,
            user: userPayload
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const registerUser = asyncHandler(async (req, res) => {
    const { 
        firstName, 
        lastName, 
        email, 
        password, 
        role, 
        phone, 
        contactNumber, 
        organizationName, 
        name,
        contactPerson, 
        vehicleType, 
        vehiclePlate 
    } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Role mapping and normalization
    const rawRole = (role || 'household').toString().trim().toLowerCase();

    // Explicitly forbid creation of privileged administrative/staff roles via public registration
    if (['staff', 'admin', 'super admin', 'super_admin'].includes(rawRole)) {
        res.status(403);
        throw new Error('Public registration cannot create privileged accounts (Staff, Admin, Super Admin).');
    }

    let canonicalRole;
    if (['household', 'resident', 'user', 'registered user', 'registered_user'].includes(rawRole)) {
        canonicalRole = 'household';
    } else if (['partner_org', 'partner_organization', 'partner organization', 'partnerorg', 'lgu'].includes(rawRole)) {
        canonicalRole = 'partner_org';
    } else if (['collector'].includes(rawRole)) {
        canonicalRole = 'collector';
    } else {
        res.status(400);
        throw new Error(`Invalid registration role '${role}'. Allowed public roles: household, partner_org, collector.`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if User already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine account names based on actor type
    let userFirstName = (firstName || '').trim();
    let userLastName = (lastName || '').trim();
    const contactPhone = (phone || contactNumber || '').trim();
    const orgName = (organizationName || name || '').trim() || (userFirstName ? `${userFirstName} ${userLastName}`.trim() : 'Partner Organization');
    const cPerson = (contactPerson || '').trim() || (userFirstName ? `${userFirstName} ${userLastName}`.trim() : orgName);

    if (canonicalRole === 'partner_org') {
        if (!userFirstName) {
            const parts = cPerson.split(' ');
            userFirstName = parts[0] || orgName;
            userLastName = parts.slice(1).join(' ') || 'Partner';
        }
    } else {
        if (!userFirstName) userFirstName = 'User';
        if (!userLastName) userLastName = canonicalRole === 'collector' ? 'Collector' : 'Resident';
    }

    // Create User record as the canonical authentication identity
    const user = await User.create({
        firstName: userFirstName,
        lastName: userLastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: canonicalRole,
        status: 'Active'
    });

    let profile = null;

    // Atomic profile creation with rollback on failure
    try {
        if (canonicalRole === 'household') {
            profile = await Resident.create({
                user: user._id,
                email: normalizedEmail,
                firstName: userFirstName,
                lastName: userLastName,
                phone: contactPhone,
                status: 'Active',
                source: 'Mobile App',
                isTemporary: false
            });
        } else if (canonicalRole === 'partner_org') {
            profile = await PartnerOrganization.create({
                user: user._id,
                name: orgName,
                contactPerson: cPerson,
                email: normalizedEmail,
                phone: contactPhone,
                password: hashedPassword,
                status: 'Active'
            });
        } else if (canonicalRole === 'collector') {
            profile = await Collector.create({
                user: user._id,
                firstName: userFirstName,
                lastName: userLastName,
                phone: contactPhone || 'Not Provided',
                vehicleType: vehicleType || 'Not Assigned',
                vehiclePlate: vehiclePlate || 'Not Assigned',
                status: 'Active'
            });
        }
    } catch (profileError) {
        // Safe rollback: remove created User if profile creation fails
        await User.findByIdAndDelete(user._id);
        res.status(400);
        throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    res.status(201).json({
        message: 'Registration successful',
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status
        },
        profileId: profile ? profile._id : null,
        accountStatus: user.status
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'strict',
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const genericResponse = { message: 'If the email exists in our system, a password reset PIN has been sent.', email: email };

    if (!user) return res.status(200).json(genericResponse);

    const pin = generatePin();
    user.resetPin = pin;
    user.resetPinExpiry = new Date(Date.now() + AUTH_CONSTANTS.PIN_EXPIRY_MS);
    await user.save();

    const result = await sendPinEmail(email, user.firstName, pin);
    if (!result || result === false || (typeof result === 'object' && !result.success)) {
        const errorMessage = (typeof result === 'object' && result.error) ? result.error : 'Failed to send email. Please try again.';
        res.status(500);
        throw new Error(errorMessage);
    }
    res.status(200).json(genericResponse);
});

const verifyPin = asyncHandler(async (req, res) => {
    const { email, pin } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (user.resetPin !== pin) {
        res.status(400);
        throw new Error('Invalid PIN');
    }
    if (new Date() > user.resetPinExpiry) {
        res.status(400);
        throw new Error('PIN has expired. Please request a new one.');
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: AUTH_CONSTANTS.RESET_TOKEN_EXPIRES_IN });
    res.json({ message: 'PIN verified successfully', resetToken, email });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, confirmPassword, resetToken } = req.body;
    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
        res.status(401);
        throw new Error('Invalid or expired reset token');
    }

    if (decoded.email !== email) {
        res.status(401);
        throw new Error('Reset token does not match the provided email');
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    user.resetPin = null;
    user.resetPinExpiry = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
});

// @desc    Get current authenticated user session & profile
// @route   GET /api/auth/me
// @access  Private (Bearer Token / Cookie)
const getMe = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let profileId = null;
    let profileType = null;
    let profile = null;

    if (['household', 'resident', 'Resident', 'User'].includes(user.role)) {
        profileType = 'Resident';
        profile = await Resident.findOne({ user: user._id });
        if (profile) profileId = profile._id;
    } else if (['partner_org', 'partner_organization', 'LGU', 'Partner Organization', 'PartnerOrganization'].includes(user.role)) {
        profileType = 'PartnerOrganization';
        profile = await PartnerOrganization.findOne({ user: user._id });
        if (profile) profileId = profile._id;
    } else if (['collector', 'Collector'].includes(user.role)) {
        profileType = 'Collector';
        profile = await Collector.findOne({ user: user._id });
        if (profile) profileId = profile._id;
    }

    const userPayload = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };

    res.json({
        user: userPayload,
        role: user.role,
        status: user.status,
        profileId,
        profileType,
        profile
    });
});

module.exports = { loginUser, registerUser, logoutUser, forgotPassword, verifyPin, resetPassword, getMe };