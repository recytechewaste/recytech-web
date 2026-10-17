const AuditLog = require('../models/AuditLog');

/**
 * Creates an immutable audit log entry.
 * Designed to be safe: failures are caught and logged so operations are never disrupted.
 *
 * @param {Object} params
 * @param {Object} [params.req] - Express request object (extracts actor, ip, userAgent)
 * @param {string} params.action - Readable action string (e.g., 'USER_CREATED', 'ROLE_UPDATED')
 * @param {string} [params.actionCategory] - Category enum ('USER_MANAGEMENT', 'ACCESS_CONTROL', etc.)
 * @param {Object} [params.actor] - Explicit actor override if not from req.user
 * @param {Object} [params.targetEntity] - { entityType, entityId, name }
 * @param {Object} [params.details] - Arbitrary context object (e.g. before/after, field changes)
 * @param {string} [params.status='SUCCESS'] - Status ('SUCCESS', 'FAILURE', 'WARNING')
 */
const logAuditEvent = async ({
    req,
    action,
    actionCategory = 'OPERATIONS',
    actor = null,
    targetEntity = null,
    details = {},
    status = 'SUCCESS'
}) => {
    try {
        let actorInfo = {
            id: null,
            name: 'System',
            email: 'system@recytech.local',
            role: 'System'
        };

        if (actor) {
            actorInfo = {
                id: actor._id || actor.id || null,
                name: actor.name || `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'Anonymous',
                email: actor.email || '',
                role: actor.role || 'Unknown'
            };
        } else if (req && req.user) {
            const u = req.user;
            actorInfo = {
                id: u._id || u.id || null,
                name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User',
                email: u.email || '',
                role: u.role || 'Unknown'
            };
        }

        const ipAddress = req
            ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '')
            : '';

        const userAgent = req ? (req.headers['user-agent'] || '') : '';

        return await AuditLog.create({
            action,
            actionCategory,
            actor: actorInfo,
            targetEntity,
            details,
            ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
            userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 255) : '',
            status
        });
    } catch (err) {
        console.error('[AuditLog] Failed to record audit log:', err.message);
        return null;
    }
};

module.exports = {
    logAuditEvent
};
