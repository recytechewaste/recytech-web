const express = require('express');
const router = express.Router();
const {
    getAllRequests,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest
} = require('../controllers/requestController');
const { protect, staffOnlyOrSuperAdmin, lgu, collector } = require('../middleware/authMiddleware');

// @route   /api/requests

// Admin & Staff routes
router.route('/')
    .get(protect, staffOnlyOrSuperAdmin, getAllRequests);

router.route('/:id')
    .put(protect, staffOnlyOrSuperAdmin, updateRequestStatus)
    .delete(protect, staffOnlyOrSuperAdmin, deleteRequest);

// LGU route
router.route('/')
    .post(protect, lgu, createLguRequest);

// Collector route
router.route('/:id/complete')
    .patch(protect, collector, completeRequest);


module.exports = router;
