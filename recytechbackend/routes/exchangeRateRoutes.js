const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getExchangeRates,
    getExchangeRateById,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    bulkImportExchangeRates
} = require('../controllers/exchangeRateController');

// @desc    Get all exchange rates
// @route   GET /api/exchange-rates
// @access  Admin only
router.get('/', protect, admin, getExchangeRates);

// @desc    Bulk create/update exchange rates
// @route   POST /api/exchange-rates/bulk/import
// @access  Admin only
router.post('/bulk/import', protect, admin, bulkImportExchangeRates);

// @desc    Get single exchange rate
// @route   GET /api/exchange-rates/:id
// @access  Admin only
router.get('/:id', protect, admin, getExchangeRateById);

// @desc    Create new exchange rate
// @route   POST /api/exchange-rates
// @access  Admin only
router.post('/', protect, admin, createExchangeRate);

// @desc    Update exchange rate
// @route   PUT /api/exchange-rates/:id
// @access  Admin only
router.put('/:id', protect, admin, updateExchangeRate);

// @desc    Delete exchange rate
// @route   DELETE /api/exchange-rates/:id
// @access  Admin only
router.delete('/:id', protect, admin, deleteExchangeRate);

module.exports = router;
