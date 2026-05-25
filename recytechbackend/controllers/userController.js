const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');

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
    const { firstName, lastName, email, password, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists && emailExists._id.toString() !== req.params.id) {
                res.status(400);
                throw new Error('Email already in use by another user');
            }
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.role = role || user.role;
        user.status = status || user.status;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();
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
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    await user.deleteOne();
    
    res.json({ message: 'User removed' });
});

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};