const express = require('express');
const router = express.Router();
const {
    getAllRequests,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest
} = require('../controllers/requestController');
const { protect, admin, staffOrAdmin, lgu, collector } = require('../middleware/authMiddleware');

// @route   /api/requests

// Admin & Staff routes
router.route('/')
    .get(protect, staffOrAdmin, getAllRequests);

router.route('/:id')
    .put(protect, staffOrAdmin, updateRequestStatus)
    .delete(protect, admin, deleteRequest);

// LGU route
router.route('/')
    .post(protect, lgu, createLguRequest);

// Collector route
router.route('/:id/complete')
    .patch(protect, collector, completeRequest);


module.exports = router;
