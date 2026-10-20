const express = require('express');
const router = express.Router();
const { protect, staffOnlyOrSuperAdmin } = require('../middleware/authMiddleware');
const {
    getForecast,
    getRecommendations,
    confirmAssignments
} = require('../controllers/schedulingController');

// @desc    Forecast upcoming collection demand using ARIMA
// @route   GET /api/scheduling/forecast
// @access  Admin or Staff
router.get('/forecast', protect, staffOnlyOrSuperAdmin, getForecast);

// @desc    Recommend collector assignments for pending approved requests
// @route   GET /api/scheduling/recommendations
// @access  Admin or Staff
router.get('/recommendations', protect, staffOnlyOrSuperAdmin, getRecommendations);

// @desc    Confirm and apply collector assignments
// @route   POST /api/scheduling/confirm-assignments
// @access  Admin or Staff
router.post('/confirm-assignments', protect, staffOnlyOrSuperAdmin, confirmAssignments);

module.exports = router;
