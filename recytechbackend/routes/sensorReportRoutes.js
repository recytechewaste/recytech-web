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
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

// Public/Partner org submit route (protected by auth)
router.post('/', protect, submitSensorReport);

// Partner Org specific reports route (with alias)
router.get('/my-reports', protect, getMyReports);
router.get('/my-incidents', protect, getMyReports);

// Operations routes: Staff, Admin, and Super Admin
router.get('/summary', protect, staffOrAdmin, getReportStats);
router.get('/stats', protect, staffOrAdmin, getReportStats);
router.get('/', protect, staffOrAdmin, getAllReports);
router.get('/:id', protect, getReportById);
router.patch('/:id/status', protect, staffOrAdmin, updateReportStatus);

module.exports = router;
