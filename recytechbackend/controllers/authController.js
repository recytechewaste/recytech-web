const User = require('../models/User');
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
        sameSite: 'strict', // Prevents CSRF attacks
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
};
const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.status === 'Inactive') {
            res.status(403);
            throw new Error('Account is deactivated. Please contact your Super Admin.');
        }

        user.lastLogin = new Date();
        await user.save();
        generateToken(res, user._id);
        res.json({ _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ 
        firstName, 
        lastName, 
        email, 
        password: hashedPassword, 
        role: 'Staff', // Hardcoded to prevent privilege escalation 
        status: 'Inactive' // Capstone workaround: Forces admin approval before login
    });

    if (user) {
        // Do not generate a token so they aren't automatically logged in
        res.status(201).json({ message: 'Registration successful! Your account is pending administrator approval before you can log in.' });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
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

    const emailSent = await sendPinEmail(email, user.firstName, pin);
    if (!emailSent) {
        res.status(500);
        throw new Error('Failed to send email. Please try again.');
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

module.exports = { loginUser, registerUser, logoutUser, forgotPassword, verifyPin, resetPassword };