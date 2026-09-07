const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    changePassword
} = require('../controllers/userController');

// @desc    Get logged-in user profile with role details
// @route   GET /api/users/profile
router.get('/profile', protect, getUserProfile);

// @desc    Update logged-in user profile
// @route   PUT /api/users/profile
router.put('/profile', protect, updateUserProfile);
router.patch('/profile', protect, updateUserProfile);

// @desc    Change logged-in user password
// @route   PUT /api/users/change-password
router.put('/change-password', protect, changePassword);

// @desc    Get all users
// @route   GET /api/users
router.get('/', protect, admin, getUsers);

// @desc    Get single user
// @route   GET /api/users/:id
router.get('/:id', protect, admin, getUserById);

// @desc    Create a new user
// @route   POST /api/users
router.post('/', protect, admin, createUser);

// @desc    Update user
// @route   PUT /api/users/:id
router.put('/:id', protect, admin, updateUser);

// @desc    Delete a user
// @route   DELETE /api/users/:id
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
