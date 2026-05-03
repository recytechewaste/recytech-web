const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const roundCurrency = (value = 0) => Math.round(value * 100) / 100;

const getRequestSummary = async () => {
    const [statusCounts, totals, topCategory] = await Promise.all([
        Request.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Request.aggregate([
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    completedRequests: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    totalCompletedItems: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'Completed'] },
                                { $ifNull: ['$quantity', 1] },
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        Request.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 1 }
        ])
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
    }, {});
    const totalStats = totals[0] || {};
    const totalRequests = totalStats.totalRequests || 0;
    const completedRequests = totalStats.completedRequests || 0;

    return {
        totalRequests,
        pendingRequests: byStatus.Pending || 0,
        approvedRequests: byStatus.Approved || 0,
        inTransitRequests: byStatus['In-Transit'] || 0,
        completedRequests,
        rejectedRequests: byStatus.Rejected || 0,
        totalCompletedItems: totalStats.totalCompletedItems || 0,
        completionRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 1000) / 10 : 0,
        topCategory: topCategory[0]?._id || 'N/A'
    };
};

const getPayoutSummary = async () => {
    const summary = await Transaction.aggregate([
        { $match: { type: 'Payment' } },
        {
            $group: {
                _id: null,
                totalPayout: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
                averagePayout: { $avg: '$amount' }
            }
        }
    ]);

    return {
        totalPayout: roundCurrency(summary[0]?.totalPayout || 0),
        payoutCount: summary[0]?.transactionCount || 0,
        averagePayout: roundCurrency(summary[0]?.averagePayout || 0)
    };
};

const getMonthlyTrends = async () => {
    const currentYear = new Date().getFullYear();
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear + 1, 0, 1);

    const [requestTrend, payoutTrend] = await Promise.all([
        Request.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    requests: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                    items: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'Completed'] },
                                { $ifNull: ['$quantity', 1] },
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        Transaction.aggregate([
            { $match: { type: 'Payment', createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    payout: { $sum: '$amount' }
                }
            }
        ])
    ]);

    const requestMap = requestTrend.reduce((acc, item) => {
        acc[item._id.month] = item;
        return acc;
    }, {});
    const payoutMap = payoutTrend.reduce((acc, item) => {
        acc[item._id.month] = item.payout;
        return acc;
    }, {});

    return MONTHS.map((name, index) => {
        const month = index + 1;
        return {
            name,
            requests: requestMap[month]?.requests || 0,
            completed: requestMap[month]?.completed || 0,
            items: requestMap[month]?.items || 0,
            payout: roundCurrency(payoutMap[month] || 0)
        };
    });
};

const getCategoryDistribution = async () => {
    return Request.aggregate([
        {
            $group: {
                _id: '$wasteType',
                requests: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                items: { $sum: { $ifNull: ['$quantity', 1] } }
            }
        },
        { $sort: { requests: -1, _id: 1 } },
        {
            $project: {
                _id: 0,
                name: '$_id',
                value: '$requests',
                requests: 1,
                completed: 1,
                items: 1
            }
        }
    ]);
};

const getResidentSummary = async () => {
    const summary = await Resident.aggregate([
        {
            $group: {
                _id: null,
                totalResidents: { $sum: 1 },
                activeResidents: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
                temporaryResidents: { $sum: { $cond: ['$isTemporary', 1, 0] } },
                totalWalletBalance: { $sum: '$walletBalance' },
                totalEarned: { $sum: '$totalEarned' }
            }
        }
    ]);

    const stats = summary[0] || {};

    return {
        totalResidents: stats.totalResidents || 0,
        activeResidents: stats.activeResidents || 0,
        temporaryResidents: stats.temporaryResidents || 0,
        totalWalletBalance: roundCurrency(stats.totalWalletBalance || 0),
        totalEarned: roundCurrency(stats.totalEarned || 0)
    };
};

const getRoleDistribution = async (userRole) => {
    if (userRole !== 'Super Admin') return [];

    const roles = await User.aggregate([
        { $group: { _id: '$role', value: { $sum: 1 } } },
        { $sort: { value: -1, _id: 1 } },
        { $project: { _id: 0, name: '$_id', value: 1 } }
    ]);

    return roles;
};

router.get('/summary', protect, async (req, res) => {
    try {
        const [requests, payouts, residents] = await Promise.all([
            getRequestSummary(),
            getPayoutSummary(),
            getResidentSummary()
        ]);

        res.json({ requests, payouts, residents });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/category-distribution', protect, async (req, res) => {
    try {
        const categories = await getCategoryDistribution();
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/monthly-trends', protect, async (req, res) => {
    try {
        const monthlyTrends = await getMonthlyTrends();
        res.json({ monthlyTrends });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/payout-summary', protect, async (req, res) => {
    try {
        const payouts = await getPayoutSummary();
        res.json({ payouts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/dashboard', protect, async (req, res) => {
    try {
        const [requests, payouts, residents, monthlyTrends, categoryDistribution, roleDistribution, recentRequests] = await Promise.all([
            getRequestSummary(),
            getPayoutSummary(),
            getResidentSummary(),
            getMonthlyTrends(),
            getCategoryDistribution(),
            getRoleDistribution(req.user?.role),
            Request.find()
                .populate('resident', 'email firstName lastName isTemporary')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            summary: {
                requests,
                payouts,
                residents
            },
            monthlyTrends,
            categoryDistribution,
            roleDistribution,
            recentRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
