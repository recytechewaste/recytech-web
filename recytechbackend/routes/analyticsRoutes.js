const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getSummaryData, 
    getCategoryDistributionData, 
    getMonthlyTrendsData, 
    getPredictiveAnalyticsData, 
    getPayoutSummaryData, 
    getDashboardData 
} = require('../controllers/analyticsController');

router.get('/summary', protect, getSummaryData);
router.get('/category-distribution', protect, getCategoryDistributionData);
router.get('/monthly-trends', protect, getMonthlyTrendsData);
router.get('/predictive-analytics', protect, getPredictiveAnalyticsData);
router.get('/payout-summary', protect, getPayoutSummaryData);
router.get('/dashboard', protect, getDashboardData);

module.exports = router;
