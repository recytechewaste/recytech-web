const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

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
