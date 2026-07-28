const ARIMA = require('arima');

const VEHICLE_CAPACITY = {
    'Truck': 30,
    'Van': 15,
    'Motorcycle': 5
};

// getVehicleCapacity remains as it is likely based on weight/volume, not item count
function getVehicleCapacity(vehicleType) {
    return VEHICLE_CAPACITY[vehicleType] || 8;
}

function getRequestLoad(request) {
    const fillLevel = request.bin?.fillLevel || 0;
    if (fillLevel >= 90) return 25; // Critical load
    if (fillLevel >= 70) return 15; // High load
    return 10; // Standard load
}

function getRequestAgeDays(request, now = new Date()) {
    const createdAt = request.createdAt ? new Date(request.createdAt) : now;
    const ageMs = now.getTime() - createdAt.getTime();
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
}

function getPriorityLevel(score) {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 35) return 'Medium';
    return 'Standard';
}

function buildPriorityTags({ fillLevel, ageDays }) {
    const tags = [];

    if (fillLevel >= 90) {
        tags.push('Critically Full');
    } else if (fillLevel >= 75) {
        tags.push('Nearing Capacity');
    }

    if (ageDays >= 3) tags.push('Aging Request');
    
    return tags;
}

function scoreRequestPriority(request, now = new Date()) {
    const load = getRequestLoad(request);
    const ageDays = getRequestAgeDays(request, now);
    const fillLevel = request.bin?.fillLevel || 0;

    // Score components: fill level is dominant, age is secondary
    const fillScore = Math.min(60, (fillLevel / 100) * 60);
    const ageScore = Math.min(30, ageDays * 7); 
    const loadScore = Math.min(10, (load / 25) * 10);

    const score = Math.round(fillScore + ageScore + loadScore);

    return {
        priorityScore: Math.min(100, score),
        priorityLevel: getPriorityLevel(score),
        ageDays,
        load,
        fillLevel,
        tags: buildPriorityTags({ fillLevel, ageDays })
    };
}

function enrichRequestsWithPriority(requests) {
    const now = new Date();

    return requests
        .map((request) => ({
            ...request,
            priority: scoreRequestPriority(request, now)
        }))
        .sort((a, b) => {
            if (b.priority.priorityScore !== a.priority.priorityScore) {
                return b.priority.priorityScore - a.priority.priorityScore;
            }
            return b.priority.ageDays - a.priority.ageDays;
        });
}

function buildAssignmentReasons(request, collector, requestWeight) {
    const reasons = [];
    const remainingCapacity = Math.max(0, collector.capacity - collector.loadAssigned);
    const projectedUtilization = Math.round(((collector.loadAssigned + requestWeight) / collector.capacity) * 100);

    if (request.priority.fillLevel >= 90) {
        reasons.push(`Bin is critically full at ${request.priority.fillLevel}%.`);
    } else if (request.priority.fillLevel >= 75) {
        reasons.push(`Bin is nearing capacity at ${request.priority.fillLevel}%.`);
    }

    if (request.priority.ageDays >= 3) {
        reasons.push(`Request has been waiting for ${request.priority.ageDays} days.`);
    }

    if (requestWeight <= remainingCapacity) {
        reasons.push(`${collector.collectorName} has enough remaining capacity.`);
    } else {
        reasons.push(`Assigned as overflow because other collectors are near capacity.`);
    }
    
    reasons.push(`Projected utilization: ${projectedUtilization}%.`);

    return reasons;
}

function flattenAssignedRequests(recommendations) {
    return recommendations.flatMap((collector) =>
        collector.assignedRequests.map((request) => ({
            ...request,
            collectorId: collector.collectorId,
            collectorName: collector.collectorName,
            vehicleType: collector.vehicleType
        }))
    );
}

function buildResourceAllocationSummary(recommendations) {
    const assignedRequests = flattenAssignedRequests(recommendations);
    const totalLoad = recommendations.reduce((sum, item) => sum + item.loadAssigned, 0);
    const totalCapacity = recommendations.reduce((sum, item) => sum + item.capacity, 0);
    const activeCollectors = recommendations.length;
    const highPriorityRequests = assignedRequests.filter((request) =>
        ['Critical', 'High'].includes(request.priorityLevel)
    ).length;
    const utilizationRate = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;
    const averageCapacity = activeCollectors > 0 ? totalCapacity / activeCollectors : 0;

    return {
        activeCollectors,
        pendingRequests: assignedRequests.length,
        totalLoad,
        totalCapacity,
        utilizationRate,
        highPriorityRequests,
        suggestedCollectorsNeeded: averageCapacity > 0 ? Math.max(1, Math.ceil(totalLoad / averageCapacity)) : 0
    };
}

function buildActionRecommendations(recommendations) {
    const assignedRequests = flattenAssignedRequests(recommendations);
    const actions = [];
    const highPriority = assignedRequests.filter((request) => ['Critical', 'High'].includes(request.priorityLevel));
    const aging = assignedRequests.filter((request) => request.ageDays >= 3);
    const nearCapacityCollectors = recommendations.filter((collector) =>
        collector.capacity > 0 && collector.loadAssigned / collector.capacity >= 0.85
    );

    if (highPriority.length > 0) {
        actions.push({
            type: 'Schedule Priority Pickups',
            severity: 'High',
            message: `Confirm ${highPriority.length} high-priority pickup(s) first to address full bins and reduce backlog.`,
            metric: `${highPriority.length} urgent`
        });
    }

    if (aging.length > 0) {
        actions.push({
            type: 'Reduce Waiting Time',
            severity: 'Medium',
            message: `${aging.length} request(s) have waited at least 3 days.`,
            metric: `${aging.length} aging`
        });
    }

    if (nearCapacityCollectors.length > 0) {
        actions.push({
            type: 'Review Collector Load',
            severity: 'Medium',
            message: `${nearCapacityCollectors.length} collector(s) are projected above 85% capacity.`,
            metric: `${nearCapacityCollectors.length} near full`
        });
    }

    if (actions.length === 0) {
        actions.push({
            type: 'Maintain Current Allocation',
            severity: 'Low',
            message: 'No urgent scheduling risks detected. Current collector allocation is balanced.',
            metric: 'Balanced'
        });
    }

    return actions;
}

function buildDailySeries(dailyCounts, startDate, endDate) {
    const series = [];
    const labels = [];
    const countsByDate = dailyCounts.reduce((acc, item) => {
        const dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
        acc[dateKey] = item.count;
        return acc;
    }, {});

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
        const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        labels.push(dateKey);
        series.push(countsByDate[dateKey] || 0);
        cursor.setDate(cursor.getDate() + 1);
    }

    return { series, labels };
}

function normalizePrediction(value) {
    return Math.max(0, Math.round(value));
}

function buildForecast(series, days = 7) {
    if (!Array.isArray(series) || series.length < 10) {
        const average = series.length > 0 ? series.reduce((sum, value) => sum + value, 0) / series.length : 0;
        return Array.from({ length: days }, () => normalizePrediction(average));
    }

    const arima = new ARIMA({ p: 2, d: 1, q: 2, P: 1, D: 1, Q: 1, s: 7, verbose: false }).train(series);
    const [predictions] = arima.predict(days);

    return predictions.map(normalizePrediction);
}

function buildCollectionRecommendations(pendingRequests, collectors) {
    const sortedRequests = enrichRequestsWithPriority(pendingRequests);

    const recommendations = collectors.map((collector) => ({
        collectorId: collector._id,
        collectorName: `${collector.firstName} ${collector.lastName}`,
        vehicleType: collector.vehicleType,
        capacity: getVehicleCapacity(collector.vehicleType),
        assignedRequests: [],
        loadAssigned: 0
    }));

    if (recommendations.length === 0) {
        return [];
    }

    for (const request of sortedRequests) {
        const requestWeight = request.priority.load;
        recommendations.sort((a, b) => a.loadAssigned / a.capacity - b.loadAssigned / b.capacity);
        const target = recommendations.find((item) => item.loadAssigned + requestWeight <= item.capacity) || recommendations[0];
        const reasons = buildAssignmentReasons(request, target, requestWeight);

        target.assignedRequests.push({
            requestId: request._id,
            binId: request.bin?.binId,
            address: request.bin?.address,
            load: requestWeight,
            priorityScore: request.priority.priorityScore,
            priorityLevel: request.priority.priorityLevel,
            fillLevel: request.priority.fillLevel,
            ageDays: request.priority.ageDays,
            tags: request.priority.tags,
            reasons,
            location: request.bin?.location,
            scheduledAt: request.scheduledAt || null
        });
        target.loadAssigned += requestWeight;
    }

    return recommendations;
}

module.exports = {
    buildDailySeries,
    buildForecast,
    getVehicleCapacity,
    enrichRequestsWithPriority,
    scoreRequestPriority,
    buildActionRecommendations,
    buildResourceAllocationSummary,
    buildCollectionRecommendations
};
