const express = require('express');
const router = express.Router();
const {
    getAllRequests,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest
} = require('../controllers/requestController');
const { protect, admin, lgu, collector } = require('../middleware/authMiddleware');

// @route   /api/requests

// Admin routes
router.route('/')
    .get(protect, admin, getAllRequests);

router.route('/:id')
    .put(protect, admin, updateRequestStatus)
    .delete(protect, admin, deleteRequest);

// LGU route
router.route('/')
    .post(protect, lgu, createLguRequest);

// Collector route
router.route('/:id/complete')
    .patch(protect, collector, completeRequest);


module.exports = router;
