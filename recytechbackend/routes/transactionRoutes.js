const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');
const { 
    getTransactions, 
    getMyTransactions,
    getTransactionStats,
    getTransactionsByResident,
    getTransactionByRequest
} = require('../controllers/transactionController');

// @desc    Get logged in resident's transactions
// @route   GET /api/transactions/my
router.get('/my', protect, getMyTransactions);

// @desc    Get all transactions (Admin/Staff)
// @route   GET /api/transactions
router.get('/', protect, staffOrAdmin, getTransactions);

// @desc    Get transaction summary statistics
// @route   GET /api/transactions/stats/summary
router.get('/stats/summary', protect, staffOrAdmin, getTransactionStats);

// @desc    Get transactions by resident ID (Admin/Staff or Self)
// @route   GET /api/transactions/resident/:residentId
router.get('/resident/:residentId', protect, getTransactionsByResident);

// @desc    Get transaction by request ID
// @route   GET /api/transactions/request/:requestId
router.get('/request/:requestId', protect, staffOrAdmin, getTransactionByRequest);

module.exports = router;
