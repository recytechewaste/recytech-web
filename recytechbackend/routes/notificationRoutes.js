const express = require('express');
const router = express.Router();
const {
    getPartnerNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { protect, partnerOrg } = require('../middleware/authMiddleware');

// All notification routes are protected and strictly scoped to Partner Organizations
router.use(protect, partnerOrg);

router.route('/')
    .get(getPartnerNotifications);

router.route('/read-all')
    .patch(markAllNotificationsAsRead);

router.route('/:id/read')
    .patch(markNotificationAsRead);

module.exports = router;
