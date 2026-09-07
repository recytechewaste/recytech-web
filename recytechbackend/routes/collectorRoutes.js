const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');
const {
    getCollectors,
    getMyCollectorProfile,
    updateCollectorStatus,
    getAssignedJobs,
    getCollectorStats,
    createCollector,
    updateCollector,
    deleteCollector
} = require('../controllers/collectorController');

// Collector mobile self workflows
router.get('/me', protect, getMyCollectorProfile);
router.patch('/status', protect, updateCollectorStatus);
router.put('/status', protect, updateCollectorStatus);
router.get('/jobs', protect, getAssignedJobs);
router.get('/stats', protect, getCollectorStats);

// Admin / Staff collector management
router.route('/')
    .get(protect, staffOrAdmin, getCollectors)
    .post(protect, staffOrAdmin, createCollector);

router.route('/:id')
    .put(protect, staffOrAdmin, updateCollector)
    .delete(protect, staffOrAdmin, deleteCollector);

module.exports = router;

