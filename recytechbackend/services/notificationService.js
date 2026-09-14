const Notification = require('../models/Notification');
const PartnerOrganization = require('../models/PartnerOrganization');

/**
 * Reusable helper to create a scoped notification for a Partner Organization.
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.partnerOrganizationId - Primary ownership key (PartnerOrganization._id)
 * @param {string|mongoose.Types.ObjectId} [params.userId] - Optional secondary user ID
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message body
 * @param {string} params.type - Notification event type category
 * @param {string} [params.relatedEntityId] - ID of related request or bin
 * @param {string} [params.destinationKind] - "lguRequest" | "lguBin"
 * @param {string} [params.destinationEntityId] - ID for in-app navigation
 * @returns {Promise<Object|null>} The created notification or null if unscoped/error
 */
const createPartnerNotification = async ({
    partnerOrganizationId,
    userId,
    title,
    message,
    type,
    relatedEntityId,
    destinationKind,
    destinationEntityId
}) => {
    try {
        let resolvedPartnerId = partnerOrganizationId;

        // If partnerOrganizationId is not supplied but userId is, resolve it
        if (!resolvedPartnerId && userId) {
            const org = await PartnerOrganization.findOne({ user: userId });
            if (org) {
                resolvedPartnerId = org._id;
            }
        }

        // Strictly enforce scoping: NEVER create an unscoped Partner notification
        if (!resolvedPartnerId) {
            console.warn('[notificationService] Notification skipped: No valid partnerOrganizationId could be resolved.');
            return null;
        }

        const notification = await Notification.create({
            recipientRole: 'partner_org',
            recipientPartnerOrganizationId: resolvedPartnerId,
            recipientUserId: userId || null,
            title: title ? title.trim() : 'New Notification',
            message: message ? message.trim() : '',
            type: type || 'general',
            relatedEntityId: relatedEntityId ? relatedEntityId.toString() : undefined,
            destinationKind: destinationKind || undefined,
            destinationEntityId: destinationEntityId ? destinationEntityId.toString() : undefined,
            isRead: false
        });

        return notification;
    } catch (error) {
        console.error('[notificationService] Failed to create partner notification:', error.message);
        return null;
    }
};

module.exports = {
    createPartnerNotification
};
