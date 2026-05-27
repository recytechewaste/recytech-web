const Transaction = require('../models/Transaction');
const Resident = require('../models/Resident');
const Request = require('../models/Request');
const { asyncHandler } = require('../utils/asyncHandler');

const getTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter options
    const filterType = req.query.type; // 'Payment', 'Refund', 'Adjustment'
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let query = {};

    if (filterType) {
        query.type = filterType;
    }

    if (startDate && endDate) {
        query.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    const transactions = await Transaction.find(query)
        .populate('resident', 'email firstName lastName totalEarned')
        .populate('requestId', 'wasteType quantity status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    // Calculate summary
    const summary = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    res.json({
        transactions,
        summary,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const getTransactionsByResident = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify resident exists
    const resident = await Resident.findById(req.params.residentId);
    if (!resident) {
        res.status(404);
        throw new Error('Resident not found');
    }

    const transactions = await Transaction.find({ resident: req.params.residentId })
        .populate('requestId', 'wasteType quantity status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments({ resident: req.params.residentId });

    // Calculate totals for resident
    const totals = await Transaction.aggregate([
        { $match: { resident: require('mongoose').Types.ObjectId(req.params.residentId) } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' }
            }
        }
    ]);

    res.json({
        resident,
        transactions,
        totals,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const getTransactionByRequest = asyncHandler(async (req, res) => {
    // Verify request exists
    const request = await Request.findById(req.params.requestId)
        .populate('assignedCollector', 'firstName lastName');
    
    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    // Find related transaction
    const transaction = await Transaction.findOne({ requestId: req.params.requestId })
        .populate('resident', 'email firstName lastName totalEarned');

    if (!transaction) {
        return res.status(404).json({ 
            message: 'No transaction found for this request',
            request
        });
    }

    res.json({
        request,
        transaction
    });
});

const getTransactionStats = asyncHandler(async (req, res) => {
    const timeframe = req.query.timeframe || 'month'; // 'week', 'month', 'year'
    
    let dateFilter = {};
    const now = new Date();

    if (timeframe === 'week') {
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'month') {
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (timeframe === 'year') {
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    const stats = await Transaction.aggregate([
        { $match: { createdAt: dateFilter, type: 'Payment' } },
        {
            $group: {
                _id: null,
                totalPayouts: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
                averagePayout: { $avg: '$amount' }
            }
        }
    ]);

    // Group by type
    const byType = await Transaction.aggregate([
        { $match: { createdAt: dateFilter } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Group by date for trend
    const trend = await Transaction.aggregate([
        { $match: { createdAt: dateFilter, type: 'Payment' } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const residentCount = await Resident.countDocuments({ status: 'Active' });
    const totalResidents = await Resident.countDocuments();

    res.json({
        timeframe,
        summary: stats[0] || {
            totalPayouts: 0,
            transactionCount: 0,
            averagePayout: 0
        },
        byType,
        trend,
        residentMetrics: {
            active: residentCount,
            total: totalResidents
        }
    });
});

module.exports = {
    getTransactions,
    getTransactionsByResident,
    getTransactionByRequest,
    getTransactionStats
};