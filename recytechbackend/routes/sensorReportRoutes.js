const express = require('express');
const router = express.Router();
const {
    submitSensorReport,
    getMyReports,
    getAllReports,
    getReportStats,
    getReportById,
    updateReportStatus
} = require('../controllers/sensorReportController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

// Public/Partner org submit route (protected by auth)
router.post('/', protect, submitSensorReport);

// Partner Org specific reports route
router.get('/my-reports', protect, getMyReports);

// STAFF ONLY ROUTES (Admin receives 403 Forbidden)
router.get('/stats', protect, staffOnly, getReportStats);
router.get('/', protect, staffOnly, getAllReports);
router.get('/:id', protect, getReportById);
router.patch('/:id/status', protect, staffOnly, updateReportStatus);

module.exports = router;
