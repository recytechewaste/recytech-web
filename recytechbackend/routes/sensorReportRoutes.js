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
const { protect, staffOnlyOrSuperAdmin } = require('../middleware/authMiddleware');

// Public/Partner org submit route (protected by auth)
router.post('/', protect, submitSensorReport);

// Partner Org specific reports route (with alias)
router.get('/my-reports', protect, getMyReports);
router.get('/my-incidents', protect, getMyReports);

// Operations routes: Staff and Super Admin only (Admin receives 403 Forbidden)
router.get('/summary', protect, staffOnlyOrSuperAdmin, getReportStats);
router.get('/stats', protect, staffOnlyOrSuperAdmin, getReportStats);
router.get('/', protect, staffOnlyOrSuperAdmin, getAllReports);
router.get('/:id', protect, getReportById);
router.patch('/:id/status', protect, staffOnlyOrSuperAdmin, updateReportStatus);

module.exports = router;
