const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getResidents,
    createResident,
    getResidentById,
    updateResident,
    deleteResident,
    searchResidents
} = require('../controllers/residentController');

// @desc    Get all residents with wallet balances
// @route   GET /api/residents
// @access  Admin only
router.get('/', protect, admin, getResidents);

// @desc    Create a new resident
// @route   POST /api/residents
// @access  Admin only
router.post('/', protect, admin, createResident);

// @desc    Search residents by email or name
// @route   GET /api/residents/search
// @access  Admin only
router.get('/search/:query', protect, admin, searchResidents);

// @desc    Get single resident with transaction history
// @route   GET /api/residents/:id
// @access  Admin only
router.get('/:id', protect, admin, getResidentById);

// @desc    Update resident (status, info)
// @route   PUT /api/residents/:id
// @access  Admin only
router.put('/:id', protect, admin, updateResident);

// @desc    Delete resident (mark inactive or hard delete)
// @route   DELETE /api/residents/:id
// @access  Admin only
router.delete('/:id', protect, admin, deleteResident);

module.exports = router;
