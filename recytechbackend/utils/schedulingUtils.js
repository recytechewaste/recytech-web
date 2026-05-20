const ARIMA = require('arima');

const VEHICLE_CAPACITY = {
    'Truck': 30,
    'E-Trike': 12,
    'Bike': 6
};

function getVehicleCapacity(vehicleType) {
    return VEHICLE_CAPACITY[vehicleType] || 8;
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
    const sortedRequests = [...pendingRequests].sort((a, b) => {
        const loadA = (a.weight || a.quantity || 1);
        const loadB = (b.weight || b.quantity || 1);
        return loadB - loadA;
    });

    const recommendations = collectors.map((collector) => ({
        collectorId: collector._id,
        collectorName: `${collector.firstName} ${collector.lastName}`,
        vehicleType: collector.vehicleType,
        capacity: getVehicleCapacity(collector.vehicleType),
        assignedRequests: [],
        loadAssigned: 0
    }));

    for (const request of sortedRequests) {
        const requestWeight = request.weight || request.quantity || 1;
        recommendations.sort((a, b) => a.loadAssigned / a.capacity - b.loadAssigned / b.capacity);
        const target = recommendations.find((item) => item.loadAssigned + requestWeight <= item.capacity) || recommendations[0];

        target.assignedRequests.push({
            requestId: request._id,
            residentName: request.residentName,
            wasteType: request.wasteType,
            load: requestWeight,
            location: request.location?.address || 'Unknown location',
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
    buildCollectionRecommendations
};