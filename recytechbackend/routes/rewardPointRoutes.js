const express = require('express');
const router = express.Router();
const { protect, admin, staffOrAdmin } = require('../middleware/authMiddleware');
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
router.get('/', protect, staffOrAdmin, getRewardPoints);

// @desc    Bulk create/update reward point rules
// @route   POST /api/reward-points/bulk/import
router.post('/bulk/import', protect, staffOrAdmin, bulkImportRewardPoints);

// @desc    Get single reward point rule
// @route   GET /api/reward-points/:id
router.get('/:id', protect, staffOrAdmin, getRewardPointById);

// @desc    Create new reward point rule
// @route   POST /api/reward-points
router.post('/', protect, staffOrAdmin, createRewardPoint);

// @desc    Update reward point rule
// @route   PUT /api/reward-points/:id
router.put('/:id', protect, staffOrAdmin, updateRewardPoint);

// @desc    Delete reward point rule
// @route   DELETE /api/reward-points/:id
// @access  Admin only
router.delete('/:id', protect, admin, deleteRewardPoint);

module.exports = router;
