const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail, sendAccountApprovedEmail } = require('../services/emailService');

const getUsers = asyncHandler(async (req, res) => {
    const { includeCollectors } = req.query;
    let query = {};

    // If includeCollectors is not explicitly 'true', exclude Collector roles
    if (includeCollectors !== 'true') {
        query = { role: { $ne: 'Collector' } };
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

// @desc    Update logged in user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;

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

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } else {
        res.status(404);
        throw new Error('User profile not found');
    }
});

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserProfile
};