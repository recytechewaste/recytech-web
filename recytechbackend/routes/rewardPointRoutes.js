const express = require('express');
const router = express.Router();
const { protect, staffOnlyOrSuperAdmin } = require('../middleware/authMiddleware');
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

// @desc    Bulk create/update reward point rules (Staff or Super Admin)
// @route   POST /api/reward-points/bulk/import
router.post('/bulk/import', protect, staffOnlyOrSuperAdmin, bulkImportRewardPoints);

// @desc    Get single reward point rule
// @route   GET /api/reward-points/:id
router.get('/:id', getRewardPointById);

// @desc    Create new reward point rule (Staff or Super Admin)
// @route   POST /api/reward-points
router.post('/', protect, staffOnlyOrSuperAdmin, createRewardPoint);

// @desc    Update reward point rule (Staff or Super Admin)
// @route   PUT /api/reward-points/:id
router.put('/:id', protect, staffOnlyOrSuperAdmin, updateRewardPoint);

// @desc    Delete reward point rule (Staff or Super Admin)
// @route   DELETE /api/reward-points/:id
router.delete('/:id', protect, staffOnlyOrSuperAdmin, deleteRewardPoint);

module.exports = router;
