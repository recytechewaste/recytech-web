const express = require('express');
const router = express.Router();
const { AUTH_CONSTANTS } = require('../config/constants');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const { 
    loginUser, 
    registerUser, 
    forgotPassword, 
    verifyPin, 
    resetPassword 
} = require('../controllers/authController');

// @desc    Authenticate a user
// @route   POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').notEmpty().withMessage('Role is required'),
    validateRequest
], loginUser);

// @desc    Register user (Public)
// @route   POST /api/auth/register
router.post('/register', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: AUTH_CONSTANTS.MIN_PASSWORD_LENGTH }).withMessage(`Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`),
    validateRequest
], registerUser);

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
    body('newPassword').isLength({ min: AUTH_CONSTANTS.MIN_PASSWORD_LENGTH }).withMessage(`Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password'),
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    validateRequest
], resetPassword);

module.exports = router;