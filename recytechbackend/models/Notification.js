const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientRole: {
        type: String,
        enum: ['partner_org', 'household', 'collector', 'admin'],
        default: 'partner_org',
        required: true
    },
    recipientPartnerOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerOrganization',
        required: function () {
            return this.recipientRole === 'partner_org';
        }
    },
    recipientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    relatedEntityId: {
        type: String,
        trim: true
    },
    destinationKind: {
        type: String,
        enum: ['lguRequest', 'lguBin'],
        trim: true
    },
    destinationEntityId: {
        type: String,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for high-performance scoped polling by Partner Organization
notificationSchema.index({ recipientPartnerOrganizationId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema, 'notifications');

module.exports = Notification;
