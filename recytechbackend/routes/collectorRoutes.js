const express = require('express');
const router = express.Router();
const { protect, admin, staffOrAdmin } = require('../middleware/authMiddleware');
const {
    getCollectors,
    createCollector,
    updateCollector,
    deleteCollector
} = require('../controllers/collectorController');

// @desc    Get all collectors
// @route   GET /api/collectors
router.get('/', protect, admin, getCollectors);

// @desc    Register a new Collector
// @route   POST /api/collectors
router.post('/', protect, admin, createCollector);

// @desc    Update a collector
// @route   PUT /api/collectors/:id
router.put('/:id', protect, admin, updateCollector);

// @desc    Delete a collector
// @route   DELETE /api/collectors/:id
router.delete('/:id', protect, admin, deleteCollector);

module.exports = router;
