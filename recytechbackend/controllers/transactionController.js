const Transaction = require('../models/Transaction');
const Resident = require('../models/Resident');
const Request = require('../models/Request');
const { asyncHandler } = require('../utils/asyncHandler');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');
const mongoose = require('mongoose');

// @desc    Get all transactions (Admin/Staff)
// @route   GET /api/transactions
// @access  Private/Admin/Staff
const getTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter options
    const filterType = req.query.type; // 'Payment', 'Refund', 'Adjustment', 'Redemption'
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
        .populate('resident', 'email firstName lastName totalPoints pointsBalance')
        .populate('requestId', 'status requestType completionDate')
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
                total: { $sum: '$points' },
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
            pages: Math.ceil(total / limit) || 1
        }
    });
});

// @desc    Get logged in resident's transactions
// @route   GET /api/transactions/my
// @access  Private (Household/Resident)
const getMyTransactions = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { profileId, profile } = await getProfileForUser(req.user._id, req.user.role);
    if (!profileId) {
        return res.status(404).json({ message: 'Resident profile not found for this user account.' });
    }

    const query = { resident: profileId };

    const transactions = await Transaction.find(query)
        .populate('requestId', 'status requestType completionDate')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    const totals = await Transaction.aggregate([
        { $match: { resident: new mongoose.Types.ObjectId(profileId) } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$points' },
                count: { $sum: 1 }
            }
        }
    ]);

    res.json({
        resident: {
            id: profile._id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            pointsBalance: profile.pointsBalance || 0,
            totalPoints: profile.totalPoints || 0
        },
        transactions,
        totals,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1
        }
    });
});

// @desc    Get transactions by resident ID
// @route   GET /api/transactions/resident/:residentId
// @access  Private (Admin, Staff, or Self)
const getTransactionsByResident = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userRole = normalizeRole(req.user.role);

    // If household, ensure they can only view their own transactions
    if (userRole === CANONICAL_ROLES.HOUSEHOLD) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId || profileId.toString() !== req.params.residentId) {
            res.status(403);
            throw new Error('Forbidden: You can only view your own transactions.');
        }
    }

    // Verify resident exists
    const resident = await Resident.findById(req.params.residentId);
    if (!resident) {
        res.status(404);
        throw new Error('Resident not found');
    }

    const transactions = await Transaction.find({ resident: req.params.residentId })
        .populate('requestId', 'status requestType completionDate')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments({ resident: req.params.residentId });

    // Calculate totals for resident
    const totals = await Transaction.aggregate([
        { $match: { resident: new mongoose.Types.ObjectId(req.params.residentId) } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$points' }
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
            pages: Math.ceil(total / limit) || 1
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
        .populate('resident', 'email firstName lastName totalPoints');

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
                totalPointsAwarded: { $sum: '$points' },
                transactionCount: { $sum: 1 },
                averagePoints: { $avg: '$points' }
            }
        }
    ]);

    // Group by type
    const byType = await Transaction.aggregate([
        { $match: { createdAt: dateFilter } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$points' },
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
                total: { $sum: '$points' },
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
            totalPointsAwarded: 0,
            transactionCount: 0,
            averagePoints: 0
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
    getMyTransactions,
    getTransactionsByResident,
    getTransactionByRequest,
    getTransactionStats
};