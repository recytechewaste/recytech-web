const User = require('../models/User');
const Resident = require('../models/Resident');
const PartnerOrganization = require('../models/PartnerOrganization');
const Collector = require('../models/Collector');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AUTH_CONSTANTS } = require('../config/constants');
const { sendPinEmail, sendVerificationEmail } = require('../services/emailService');
const { MAX_ATTEMPTS, createVerificationState, compareCode, isExpired } = require('../services/emailVerificationService');
const { asyncHandler } = require('../utils/asyncHandler');
const { assertUniqueCollectorFields, formatPlateForStorage } = require('../utils/collectorUniqueness');
const { logAuditEvent } = require('../utils/auditLogger');

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
        if (['Inactive', 'inactive', 'Pending', 'pending'].includes(user.status)) {
            res.status(403);
            throw new Error('Your account is pending administrator approval. You will receive an email once activated.');
        }
        if (['Disabled', 'Rejected', 'disabled', 'rejected'].includes(user.status)) {
            res.status(403);
            throw new Error('Account is deactivated. Please contact your Super Admin.');
        }
        if (user.emailVerified === false) {
            return res.status(403).json({
                code: 'email_verification_required',
                message: 'Please verify your email before logging in.',
                email: user.email,
                emailVerificationRequired: true
            });
        }

        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(res, user._id);

        if (['Admin', 'Super Admin', 'Staff'].includes(user.role)) {
            await logAuditEvent({
                req,
                action: 'USER_LOGIN',
                actionCategory: 'SECURITY',
                actor: user,
                targetEntity: { entityType: 'User', entityId: user._id.toString(), name: `${user.firstName} ${user.lastName}` },
                details: { role: user.role }
            });
        }

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

        const normalizedAccountStatus = (user.status || 'Active').toLowerCase();

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
            accountStatus: normalizedAccountStatus,
            token,
            user: {
                ...userPayload,
                accountStatus: normalizedAccountStatus
            }
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
        source,
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
    // Registrations from web portal default to 'Staff'
    const rawRole = (role || (source === 'web' ? 'staff' : 'household')).toString().trim().toLowerCase();

    // Explicitly forbid creation of top-level administrative accounts (Admin, Super Admin) via public registration
    if (['admin', 'super admin', 'super_admin', 'superadmin'].includes(rawRole)) {
        res.status(403);
        throw new Error('Public registration cannot create administrative accounts (Admin, Super Admin).');
    }

    let canonicalRole;
    if (['staff'].includes(rawRole)) {
        canonicalRole = 'Staff';
    } else if (['household', 'resident', 'user', 'registered user', 'registered_user'].includes(rawRole)) {
        canonicalRole = 'household';
    } else if (['partner_org', 'partner_organization', 'partner organization', 'partnerorg', 'lgu'].includes(rawRole)) {
        canonicalRole = 'partner_org';
    } else if (['collector'].includes(rawRole)) {
        canonicalRole = 'collector';
    } else {
        res.status(400);
        throw new Error(`Invalid registration role '${role}'. Allowed public roles: Staff, household, partner_org, collector.`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if User already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // Collectors must have a unique phone number and vehicle plate
    if (canonicalRole === 'collector') {
        await assertUniqueCollectorFields({ phone: phone || contactNumber, vehiclePlate }, res);
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
    } else if (canonicalRole === 'Staff') {
        if (!userFirstName) userFirstName = 'Staff';
        if (!userLastName) userLastName = 'Member';
    } else {
        if (!userFirstName) userFirstName = 'User';
        if (!userLastName) userLastName = canonicalRole === 'collector' ? 'Collector' : 'Resident';
    }

    // Web public registrations for Staff require Admin approval/activation for security
    const initialStatus = canonicalRole === 'Staff' ? 'Inactive' : 'Active';
    const isHouseholdRegistration = canonicalRole === 'household';
    const verification = isHouseholdRegistration ? createVerificationState(normalizedEmail) : null;

    // Create User record as the canonical authentication identity
    const user = await User.create({
        firstName: userFirstName,
        lastName: userLastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: canonicalRole,
        status: initialStatus,
        ...(isHouseholdRegistration ? { emailVerified: false, emailVerification: verification.state } : {})
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
                vehiclePlate: formatPlateForStorage(vehiclePlate),
                status: 'Active'
            });
        }
    } catch (profileError) {
        // Safe rollback: remove created User if profile creation fails
        await User.findByIdAndDelete(user._id);
        res.status(400);
        throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    if (isHouseholdRegistration) {
        let emailSent = false;
        try {
            const result = await sendVerificationEmail(normalizedEmail, userFirstName, verification.code);
            emailSent = Boolean(result && result.success);
        } catch (emailError) {
            console.error('[Email verification] Delivery failed:', emailError?.name || 'provider_error');
        }
        return res.status(201).json({
            message: 'Registration successful',
            email: normalizedEmail,
            emailVerificationRequired: true,
            emailSent
        });
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
        accountStatus: (user.status || 'Active').toLowerCase()
    });
});

const verifyEmail = asyncHandler(async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const code = req.body.code || req.body.pin;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (user.emailVerified !== false) {
        return res.json({ message: 'Email is already verified.', email, emailVerificationRequired: false });
    }

    const state = user.emailVerification;
    if (!state || isExpired(state)) {
        res.status(400);
        throw new Error('Verification code has expired. Please request a new one.');
    }
    if ((state.attempts || 0) >= MAX_ATTEMPTS) {
        res.status(429);
        throw new Error('Too many incorrect verification attempts. Please request a new code.');
    }
    if (!compareCode(email, code, state.codeHash)) {
        const updatedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                emailVerified: false,
                'emailVerification.codeHash': state.codeHash,
                'emailVerification.attempts': { $lt: MAX_ATTEMPTS }
            },
            { $inc: { 'emailVerification.attempts': 1 } },
            { new: true }
        );
        const attempts = updatedUser?.emailVerification?.attempts || (state.attempts || 0) + 1;
        res.status(attempts >= MAX_ATTEMPTS ? 429 : 400);
        throw new Error(attempts >= MAX_ATTEMPTS
            ? 'Too many incorrect verification attempts. Please request a new code.'
            : 'Invalid verification code');
    }

    const verifiedUser = await User.findOneAndUpdate(
        {
            _id: user._id,
            emailVerified: false,
            'emailVerification.codeHash': state.codeHash,
            'emailVerification.expiresAt': { $gt: new Date() },
            'emailVerification.attempts': { $lt: MAX_ATTEMPTS }
        },
        {
            $set: { emailVerified: true, emailVerifiedAt: new Date() },
            $unset: { emailVerification: 1 }
        },
        { new: true }
    );
    if (!verifiedUser) {
        res.status(400);
        throw new Error('Invalid or expired verification code. Please request a new one.');
    }
    res.json({ message: 'Email verified successfully.', email, emailVerificationRequired: false });
});

const resendVerification = asyncHandler(async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (user.emailVerified !== false) {
        return res.json({ message: 'Email is already verified.', email, emailVerificationRequired: false, emailSent: false });
    }

    const now = new Date();
    if (user.emailVerification?.resendAvailableAt && new Date(user.emailVerification.resendAvailableAt) > now) {
        res.status(429);
        throw new Error('Please wait before requesting another verification code.');
    }

    const verification = createVerificationState(email, now);
    user.emailVerification = verification.state;
    await user.save();

    try {
        const result = await sendVerificationEmail(email, user.firstName, verification.code);
        if (!result || !result.success) {
            user.emailVerification.resendAvailableAt = now;
            await user.save();
            return res.status(502).json({ message: 'Verification email could not be sent. Please try again.', email, emailVerificationRequired: true, emailSent: false });
        }
        return res.json({ message: 'Verification email sent.', email, emailVerificationRequired: true, emailSent: true });
    } catch (emailError) {
        user.emailVerification.resendAvailableAt = now;
        await user.save();
        console.error('[Email verification] Resend failed:', emailError?.name || 'provider_error');
        return res.status(502).json({ message: 'Verification email could not be sent. Please try again.', email, emailVerificationRequired: true, emailSent: false });
    }
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

    const normalizedAccountStatus = (user.status || 'Active').toLowerCase();

    const userPayload = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        accountStatus: normalizedAccountStatus,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };

    res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        profileId,
        accountStatus: normalizedAccountStatus,
        user: userPayload,
        profileType,
        profile
    });
});

module.exports = { loginUser, registerUser, logoutUser, forgotPassword, verifyPin, resetPassword, verifyEmail, resendVerification, getMe };
