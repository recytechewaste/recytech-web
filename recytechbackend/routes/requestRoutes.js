const express = require('express');
const router = express.Router();
const {
    getAllRequests,
    getRequestById,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest
} = require('../controllers/requestController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

// @route   /api/requests

// Collection requests listing and creation
router.route('/')
    .get(protect, getAllRequests)
    .post(protect, createLguRequest);

// Collector complete endpoint
router.route('/:id/complete')
    .patch(protect, completeRequest)
    .post(protect, completeRequest);

// Single request operations
router.route('/:id')
    .get(protect, getRequestById)
    .put(protect, updateRequestStatus)
    .patch(protect, updateRequestStatus)
    .delete(protect, staffOrAdmin, deleteRequest);

module.exports = router;

