const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @desc Get paginated audit logs with search and category filtering
 * @route GET /api/audit-logs
 * @access Private (Admin, Super Admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { category, search, startDate, endDate, status } = req.query;

    const query = {};

    if (category && category !== 'ALL') {
        query.actionCategory = category;
    }

    if (status && status !== 'ALL') {
        query.status = status;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            // Set end of day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            // Cap at now to respect recommendation #1
            query.createdAt.$lte = new Date(Math.min(end.getTime(), Date.now()));
        } else {
            query.createdAt.$lte = new Date();
        }
    }

    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
            { action: regex },
            { 'actor.name': regex },
            { 'actor.email': regex },
            { 'targetEntity.name': regex },
            { 'targetEntity.entityType': regex },
            { ipAddress: regex }
        ];
    }

    const [logs, totalLogs] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AuditLog.countDocuments(query)
    ]);

    res.json({
        success: true,
        logs,
        totalLogs,
        totalPages: Math.ceil(totalLogs / limit) || 1,
        currentPage: page,
        limit
    });
});

/**
 * @desc Get high-level audit summary statistics for dashboard display
 * @route GET /api/audit-logs/summary
 * @access Private (Admin, Super Admin)
 */
const getAuditSummary = asyncHandler(async (req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, categoryBreakdown, recentCriticalEvents] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: startOfToday } }),
        AuditLog.aggregate([
            {
                $group: {
                    _id: '$actionCategory',
                    count: { $sum: 1 }
                }
            }
        ]),
        AuditLog.find({
            action: {
                $in: [
                    'USER_ROLE_CHANGED',
                    'USER_DEACTIVATED',
                    'PASSWORD_CHANGED',
                    'REWARD_POINTS_UPDATED'
                ]
            }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
    ]);

    const categories = {};
    categoryBreakdown.forEach(c => {
        if (c._id) categories[c._id] = c.count;
    });

    res.json({
        success: true,
        summary: {
            totalLogs,
            todayLogs,
            categories,
            recentCriticalEvents
        }
    });
});

module.exports = {
    getAuditLogs,
    getAuditSummary
};
