const express = require('express');
const router = express.Router();
const { protect, admin, staffOrAdmin } = require('../middleware/authMiddleware');
const { 
    getSummaryData, 
    getCategoryDistributionData, 
    getMonthlyTrendsData, 
    getPredictiveAnalyticsData, 
    getDashboardData,
    getReportData
} = require('../controllers/analyticsController');

router.get('/summary', protect, staffOrAdmin, getSummaryData);
router.get('/category-distribution', protect, staffOrAdmin, getCategoryDistributionData);
router.get('/monthly-trends', protect, staffOrAdmin, getMonthlyTrendsData);
router.get('/predictive-analytics', protect, staffOrAdmin, getPredictiveAnalyticsData);
router.get('/dashboard', protect, admin, getDashboardData);
router.get('/reports', protect, staffOrAdmin, getReportData);

module.exports = router;
