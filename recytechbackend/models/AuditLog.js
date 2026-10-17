const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    actionCategory: {
        type: String,
        required: true,
        enum: ['USER_MANAGEMENT', 'ACCESS_CONTROL', 'SYSTEM_CONFIG', 'OPERATIONS', 'SECURITY', 'COLLECTOR_MANAGEMENT'],
        default: 'OPERATIONS',
        index: true
    },
    actor: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        name: {
            type: String,
            default: 'System / Guest'
        },
        email: {
            type: String,
            default: ''
        },
        role: {
            type: String,
            default: 'System'
        }
    },
    targetEntity: {
        entityType: {
            type: String,
            trim: true
        },
        entityId: {
            type: String,
            trim: true
        },
        name: {
            type: String,
            trim: true
        }
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'WARNING'],
        default: 'SUCCESS'
    }
}, {
    timestamps: true
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ 'actor.email': 1 });
auditLogSchema.index({ 'actor.role': 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
