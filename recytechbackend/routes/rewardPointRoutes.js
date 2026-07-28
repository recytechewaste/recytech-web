const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getRewardPoints,
    getRewardPointById,
    createRewardPoint,
    updateRewardPoint,
    deleteRewardPoint,
    bulkImportRewardPoints
} = require('../controllers/rewardPointController');

// @desc    Get all reward point rules
// @route   GET /api/reward-points
// @access  Admin only
router.get('/', protect, admin, getRewardPoints);

// @desc    Bulk create/update reward point rules
// @route   POST /api/reward-points/bulk/import
// @access  Admin only
router.post('/bulk/import', protect, admin, bulkImportRewardPoints);

// @desc    Get single reward point rule
// @route   GET /api/reward-points/:id
// @access  Admin only
router.get('/:id', protect, admin, getRewardPointById);

// @desc    Create new reward point rule
// @route   POST /api/reward-points
// @access  Admin only
router.post('/', protect, admin, createRewardPoint);

// @desc    Update reward point rule
// @route   PUT /api/reward-points/:id
// @access  Admin only
router.put('/:id', protect, admin, updateRewardPoint);

// @desc    Delete reward point rule
// @route   DELETE /api/reward-points/:id
// @access  Admin only
router.delete('/:id', protect, admin, deleteRewardPoint);

module.exports = router;
