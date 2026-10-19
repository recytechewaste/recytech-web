const express = require('express');
const router = express.Router();
const { AUTH_CONSTANTS } = require('../config/constants');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');
const { 
    loginUser, 
    registerUser, 
    logoutUser,
    getMe,
    forgotPassword, 
    verifyPin, 
    resetPassword,
    verifyEmail,
    resendVerification
} = require('../controllers/authController');

// @desc    Authenticate a user
// @route   POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
], loginUser);

// @desc    Get current authenticated session & profile
// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @desc    Log out current user
// @route   POST /api/auth/logout
router.post('/logout', logoutUser);

// @desc    Register user (Public - Mobile & Web)
// @route   POST /api/auth/register
router.post('/register', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
], registerUser);

// @desc    Verify a mobile household registration email
// @route   POST /api/auth/verify-email
router.post('/verify-email', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('code').optional().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Verification code must be exactly 6 digits'),
    body('pin').optional().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Verification code must be exactly 6 digits'),
    validateRequest
], verifyEmail);

// @desc    Resend a mobile household registration email
// @route   POST /api/auth/resend-verification
router.post('/resend-verification', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validateRequest
], resendVerification);

// @desc    Request password reset (sends PIN via email)
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validateRequest
], forgotPassword);

// @desc    Verify PIN
// @route   POST /api/auth/verify-pin
router.post('/verify-pin', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
    validateRequest
], verifyPin);

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
router.post('/reset-password', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('newPassword')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
        .withMessage('Password must be at least 8 characters, including upper, lower, number, and special character'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password'),
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    validateRequest
], resetPassword);

module.exports = router;
