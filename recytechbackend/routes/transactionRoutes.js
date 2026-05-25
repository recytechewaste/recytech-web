const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getTransactions,
    getTransactionsByResident,
    getTransactionByRequest,
    getTransactionStats
} = require('../controllers/transactionController');

// @desc    Get all transactions (paginated)
// @route   GET /api/transactions
// @access  Admin only
router.get('/', protect, admin, getTransactions);

// @desc    Get transaction summary (dashboard stats)
// @route   GET /api/transactions/stats/summary
// @access  Admin only
router.get('/stats/summary', protect, admin, getTransactionStats);

// @desc    Get transactions for specific resident
// @route   GET /api/transactions/resident/:residentId
// @access  Admin only
router.get('/resident/:residentId', protect, admin, getTransactionsByResident);

// @desc    Get transaction for specific request
// @route   GET /api/transactions/request/:requestId
// @access  Admin only
router.get('/request/:requestId', protect, admin, getTransactionByRequest);

module.exports = router;
