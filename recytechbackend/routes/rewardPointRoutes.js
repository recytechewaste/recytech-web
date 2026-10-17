const express = require('express');
const router = express.Router();
const { protect, superAdmin } = require('../middleware/authMiddleware');
const {
    getRewardPoints,
    getRewardPointById,
    createRewardPoint,
    updateRewardPoint,
    deleteRewardPoint,
    bulkImportRewardPoints
} = require('../controllers/rewardPointController');

// @desc    Get all reward point rules (Read-only public/authenticated)
// @route   GET /api/reward-points
router.get('/', getRewardPoints);

// @desc    Bulk create/update reward point rules (Super Admin only)
// @route   POST /api/reward-points/bulk/import
router.post('/bulk/import', protect, superAdmin, bulkImportRewardPoints);

// @desc    Get single reward point rule
// @route   GET /api/reward-points/:id
router.get('/:id', getRewardPointById);

// @desc    Create new reward point rule (Super Admin only)
// @route   POST /api/reward-points
router.post('/', protect, superAdmin, createRewardPoint);

// @desc    Update reward point rule (Super Admin only)
// @route   PUT /api/reward-points/:id
router.put('/:id', protect, superAdmin, updateRewardPoint);

// @desc    Delete reward point rule (Super Admin only)
// @route   DELETE /api/reward-points/:id
router.delete('/:id', protect, superAdmin, deleteRewardPoint);

module.exports = router;
