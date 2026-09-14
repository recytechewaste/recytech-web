const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const PartnerOrganization = require('../models/PartnerOrganization');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');

/**
 * Helper to resolve the authenticated PartnerOrganization ID
 */
const resolvePartnerOrgId = async (user) => {
    if (!user) return null;

    // Try canonical roleHelper first
    const { profileId } = await getProfileForUser(user._id, user.role);
    if (profileId) return profileId;

    // Fallback: check direct user reference or email match on PartnerOrganization
    let org = await PartnerOrganization.findOne({ user: user._id });
    if (!org && user.email) {
        org = await PartnerOrganization.findOne({ email: user.email });
    }
    return org?._id || null;
};

/**
 * Helper to format a notification document for Flutter mobile client compatibility
 */
const formatNotification = (doc) => ({
    id: doc._id.toString(),
    title: doc.title || '',
    message: doc.message || '',
    timestamp: (doc.createdAt || new Date()).toISOString(),
    isRead: Boolean(doc.isRead),
    role: doc.recipientRole || 'partner_org',
    type: doc.type || 'general',
    relatedEntityId: doc.relatedEntityId || null,
    destination: {
        kind: doc.destinationKind || null,
        entityId: doc.destinationEntityId || null
    }
});

// @desc    Get all notifications for authenticated Partner Organization
// @route   GET /api/notifications
// @access  Private (Partner Organization)
const getPartnerNotifications = asyncHandler(async (req, res) => {
    const partnerOrgId = await resolvePartnerOrgId(req.user);

    if (!partnerOrgId) {
        return res.status(200).json({ notifications: [] });
    }

    const docs = await Notification.find({
        recipientRole: 'partner_org',
        recipientPartnerOrganizationId: partnerOrgId
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    const notifications = docs.map(formatNotification);

    return res.status(200).json({ notifications });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Partner Organization)
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const partnerOrgId = await resolvePartnerOrgId(req.user);
    if (!partnerOrgId) {
        return res.status(404).json({ message: 'Partner Organization profile not found' });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify ownership: notification must belong to this specific partner organization
    if (notification.recipientPartnerOrganizationId?.toString() !== partnerOrgId.toString()) {
        return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
        success: true,
        notification: formatNotification(notification)
    });
});

// @desc    Mark all unread notifications as read for authenticated Partner Organization
// @route   PATCH /api/notifications/read-all
// @access  Private (Partner Organization)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const partnerOrgId = await resolvePartnerOrgId(req.user);

    if (!partnerOrgId) {
        return res.status(404).json({ message: 'Partner Organization profile not found' });
    }

    const result = await Notification.updateMany(
        {
            recipientRole: 'partner_org',
            recipientPartnerOrganizationId: partnerOrgId,
            isRead: false
        },
        {
            $set: { isRead: true }
        }
    );

    return res.status(200).json({
        success: true,
        modifiedCount: result.modifiedCount
    });
});

module.exports = {
    getPartnerNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
