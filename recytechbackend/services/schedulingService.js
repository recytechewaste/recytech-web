const Request = require('../models/Request');
const Collector = require('../models/Collector');
const RewardPoint = require('../models/RewardPoint');
const {
    buildDailySeries,
    buildForecast,
    buildCollectionRecommendations,
    buildActionRecommendations,
    buildResourceAllocationSummary
} = require('../utils/schedulingUtils');

async function getCollectionForecast(days = 7) {
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

    return {
        model: 'ARIMA',
        trainingDays: series.length,
        forecastDays: days,
        history: labels.map((date, index) => ({ date, count: series[index] })),
        forecast
    };
}

async function getSchedulingRecommendations() {
    const pendingRequests = await Request.find({
        status: 'Pending',
    }).populate('bin').lean();

    const collectors = await Collector.find({ status: 'Active' }).lean();

    const recommendations = buildCollectionRecommendations(pendingRequests, collectors);

    return {
        totalPendingRequests: pendingRequests.length,
        totalCollectors: collectors.length,
        resourceSummary: buildResourceAllocationSummary(recommendations),
        actionRecommendations: buildActionRecommendations(recommendations),
        recommendations,
        note: 'These are suggested collector assignments based on bin fill-level and request age. Review and confirm before scheduling.'
    };
}

async function confirmCollectorAssignments(assignments = []) {
    const results = [];
    const errors = [];

    const validAssignments = [];
    const requestIds = [];
    const collectorIds = [];

    // 1. Initial Validation
    for (const assignment of assignments) {
        const { requestId, collectorId, scheduledDate } = assignment;

        if (!requestId || !collectorId || !scheduledDate) {
            errors.push({ requestId, error: 'Missing requestId, collectorId, or scheduledDate' });
            continue;
        }

        const a_scheduledDate = new Date(scheduledDate);
        if (Number.isNaN(a_scheduledDate.getTime())) {
            errors.push({ requestId, error: 'Invalid scheduled date/time' });
            continue;
        }

        validAssignments.push({ requestId, collectorId, scheduledDate: a_scheduledDate });
        requestIds.push(requestId);
        collectorIds.push(collectorId);
    }

    if (validAssignments.length === 0) {
        return {
            totalProcessed: assignments.length,
            successful: 0,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    // 2. Fetch all necessary data concurrently
    const [requests, collectors, activeSchedules] = await Promise.all([
        Request.find({ _id: { $in: requestIds } }),
        Collector.find({ _id: { $in: collectorIds } }),
        Request.find({
            assignedCollector: { $in: collectorIds },
            status: { $in: ['Scheduled', 'In Progress'] }
        }).select('_id assignedCollector scheduledDate')
    ]);

    // 3. Create maps for O(1) access
    const requestsMap = new Map(requests.map(r => [r._id.toString(), r]));
    const collectorsMap = new Map(collectors.map(c => [c._id.toString(), c]));
    
    const scheduleMap = new Map();
    activeSchedules.forEach(req => {
        if (!req.scheduledDate) return;
        const cId = req.assignedCollector.toString();
        if (!scheduleMap.has(cId)) scheduleMap.set(cId, []);
        scheduleMap.get(cId).push({ requestId: req._id.toString(), time: req.scheduledDate.getTime() });
    });

    // 4. Process assignments against in-memory data
    const savePromises = [];

    for (const assignment of validAssignments) {
        const { requestId, collectorId, scheduledDate } = assignment;
        const reqStr = requestId.toString();
        const colStr = collectorId.toString();

        const request = requestsMap.get(reqStr);
        if (!request) { errors.push({ requestId, error: 'Request not found' }); continue; }
        if (request.status !== 'Pending') { errors.push({ requestId, error: `Request status is ${request.status}, not Pending` }); continue; }

        const collector = collectorsMap.get(colStr);
        if (!collector) { errors.push({ requestId, error: 'Collector not found' }); continue; }
        if (collector.status !== 'Active') { errors.push({ requestId, error: 'Collector is not active' }); continue; }

        const collectorSchedules = scheduleMap.get(colStr) || [];
        const newTime = scheduledDate.getTime();
        const hasConflict = collectorSchedules.some(sched => sched.time === newTime && sched.requestId !== reqStr);

        if (hasConflict) {
            errors.push({ requestId, error: 'Schedule conflict detected for collector' });
            continue;
        }

        request.assignedCollector = collectorId;
        request.scheduledDate = scheduledDate;
        request.status = 'Scheduled';
        
        // Update local map to prevent conflicts within this batch
        collectorSchedules.push({ requestId: reqStr, time: newTime });
        scheduleMap.set(colStr, collectorSchedules);

        // Queue save
        savePromises.push(
            request.save()
                .then(updatedRequest => {
                    results.push({ requestId, success: true, message: 'Assignment confirmed', request: updatedRequest });
                })
                .catch(error => {
                    errors.push({ requestId, error: error.message });
                })
        );
    }

    // 5. Execute all saves concurrently
    await Promise.all(savePromises);

    return {
        totalProcessed: assignments.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
    };
}

module.exports = {
    getCollectionForecast,
    getSchedulingRecommendations,
    confirmCollectorAssignments
};
