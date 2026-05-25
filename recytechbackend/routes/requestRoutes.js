const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    getRequestPayout,
    getPendingPayouts
} = require('../controllers/requestController');

// @desc    Get all requests (For the Dashboard Table)
// @route   GET /api/requests
router.get('/', protect, getRequests);

// @desc    Create a dummy request (For testing purposes)
// @route   POST /api/requests
router.post('/', protect, createRequest);

// @desc    Update request status (Approve/Reject/Complete with automatic payout)
// @route   PUT /api/requests/:id
// @access  Protected (Staff, Admin, Super Admin)
router.put('/:id', protect, updateRequest);

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Protected (Admin, Super Admin)
router.delete('/:id', protect, admin, deleteRequest);

// @desc    Get all pending payouts (completed but not yet paid)
// @route   GET /api/requests/pending-payouts
// @access  Protected (Admin)
router.get('/pending-payouts', protect, admin, getPendingPayouts);

// @desc    Get payout info for a single request
// @route   GET /api/requests/:id/payout
// @access  Protected (Admin)
router.get('/:id/payout', protect, admin, getRequestPayout);

module.exports = router;
