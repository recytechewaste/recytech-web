const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Collector = require('../models/Collector');
const { protect, admin } = require('../middleware/authMiddleware');
const { buildDailySeries, buildForecast, buildCollectionRecommendations } = require('../utils/schedulingUtils');

// @desc    Forecast upcoming collection demand using ARIMA
// @route   GET /api/scheduling/forecast
// @access  Admin only
router.get('/forecast', protect, admin, async (req, res) => {
    try {
        const days = parseInt(req.query.days, 10) || 7;
        const end = new Date();
        const start = new Date(end);
        start.setDate(end.getDate() - 90);

        const dailyCounts = await Request.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lt: end },
                    status: { $ne: 'Rejected' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const { series, labels } = buildDailySeries(dailyCounts, start, end);
        const predictions = buildForecast(series, days);
        const forecast = predictions.map((value, index) => {
            const date = new Date(end);
            date.setDate(end.getDate() + index + 1);
            return {
                date: date.toISOString().split('T')[0],
                predictedRequests: value
            };
        });

        res.json({
            model: 'ARIMA',
            trainingDays: series.length,
            forecastDays: days,
            history: labels.map((date, index) => ({ date, count: series[index] })),
            forecast
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Recommend collector assignments for pending approved requests
// @route   GET /api/scheduling/recommendations
// @access  Admin only
router.get('/recommendations', protect, admin, async (req, res) => {
    try {
        const pendingRequests = await Request.find({
            status: 'Approved',
            assignedCollector: { $exists: false }
        }).lean();

        const collectors = await Collector.find({ status: 'Active' }).lean();

        const recommendations = buildCollectionRecommendations(pendingRequests, collectors);

        res.json({
            totalPendingRequests: pendingRequests.length,
            totalCollectors: collectors.length,
            recommendations,
            note: 'These are suggested collector assignments based on vehicle capacity and current pending requests. Review and confirm before scheduling.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Confirm and apply collector assignments
// @route   POST /api/scheduling/confirm-assignments
// @access  Admin only
router.post('/confirm-assignments', protect, admin, async (req, res) => {
    try {
        const { assignments } = req.body; // Array of { requestId, collectorId, scheduledAt }

        if (!Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({ message: 'No assignments provided.' });
        }

        const results = [];
        const errors = [];

        for (const assignment of assignments) {
            const { requestId, collectorId, scheduledAt } = assignment;

            if (!requestId || !collectorId || !scheduledAt) {
                errors.push({ requestId, error: 'Missing requestId, collectorId, or scheduledAt' });
                continue;
            }

            try {
                // Verify request exists and is Approved
                const request = await Request.findById(requestId);
                if (!request) {
                    errors.push({ requestId, error: 'Request not found' });
                    continue;
                }

                if (request.status !== 'Approved') {
                    errors.push({ requestId, error: `Request status is ${request.status}, not Approved` });
                    continue;
                }

                // Verify collector exists and is active
                const collector = await Collector.findById(collectorId);
                if (!collector) {
                    errors.push({ requestId, error: 'Collector not found' });
                    continue;
                }

                if (collector.status !== 'Active') {
                    errors.push({ requestId, error: 'Collector is not active' });
                    continue;
                }

                // Check for scheduling conflicts
                const scheduledDate = new Date(scheduledAt);
                const conflictRequest = await Request.findOne({
                    _id: { $ne: requestId },
                    assignedCollector: collectorId,
                    scheduledAt: scheduledDate,
                    status: { $in: ['Approved', 'In-Transit'] }
                });

                if (conflictRequest) {
                    errors.push({ requestId, error: 'Schedule conflict detected for collector' });
                    continue;
                }

                // Update request with assignment
                request.assignedCollector = collectorId;
                request.scheduledAt = scheduledDate;
                const updatedRequest = await request.save();

                results.push({
                    requestId,
                    success: true,
                    message: 'Assignment confirmed',
                    request: updatedRequest
                });
            } catch (error) {
                errors.push({ requestId, error: error.message });
            }
        }

        res.json({
            totalProcessed: assignments.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;