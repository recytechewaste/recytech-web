const BinDropoff = require('../models/BinDropoff');
const RecyclingCenter = require('../models/RecyclingCenter');
const Resident = require('../models/Resident');
const { asyncHandler } = require('../utils/asyncHandler');
const { linearRegression, seasonalDecomposition, statisticalSummary, detectOutliers } = require('../utils/predictiveAnalytics');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getDropoffSummary = async () => {
    const [totals, wasteTypeBreakdown, binStats] = await Promise.all([
        BinDropoff.aggregate([
            {
                $group: {
                    _id: null,
                    totalDropoffs: { $sum: 1 },
                    totalKilograms: { $sum: '$kilograms' },
                    totalPoints: { $sum: '$pointsAwarded' }
                }
            }
        ]),
        BinDropoff.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 }, totalKg: { $sum: '$kilograms' } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        RecyclingCenter.aggregate([
            {
                $group: {
                _id: null,
                    totalBins: { $sum: 1 },
                    operationalBins: { $sum: { $cond: [{ $ne: ['$status', 'Maintenance'] }, 1, 0] } },
                    nearCapacity: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gt: ['$capacityKg', 0] }, { $gte: [{ $divide: ['$currentFillKg', '$capacityKg'] }, 0.8] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ])
    ]);

    const dropoffTotals = totals[0] || { totalDropoffs: 0, totalKilograms: 0, totalPoints: 0 };
    const bins = binStats[0] || { totalBins: 0, operationalBins: 0, nearCapacity: 0 };
    const topWasteType = wasteTypeBreakdown[0] || { _id: 'N/A' };

    return {
        totalDropoffs: dropoffTotals.totalDropoffs,
        totalKilograms: Math.round(dropoffTotals.totalKilograms * 100) / 100,
        totalPoints: Math.round(dropoffTotals.totalPoints * 100) / 100,
        totalBins: bins.totalBins,
        operationalBins: bins.operationalBins,
        binsNearCapacity: bins.nearCapacity,
        topWasteType: topWasteType._id
    };
};

const getMonthlyDropoffTrends = async () => {
    const targetYear = new Date().getFullYear();
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);

    const trends = await BinDropoff.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                dropoffs: { $sum: 1 },
                kilograms: { $sum: '$kilograms' },
                points: { $sum: '$pointsAwarded' }
            }
        }
    ]);

    const trendMap = trends.reduce((acc, item) => {
        acc[item._id.month] = item;
        return acc;
    }, {});

    return MONTHS.map((name, index) => {
        const month = index + 1;
        const data = trendMap[month] || {};
        return {
            name,
            dropoffs: data.dropoffs || 0,
            kilograms: Math.round((data.kilograms || 0) * 100) / 100,
            points: Math.round((data.points || 0) * 100) / 100
        };
    });
};

const getDropoffPredictiveAnalytics = async () => {
    const start = new Date(new Date().getFullYear() - 1, 0, 1);
    const end = new Date(new Date().getFullYear() + 1, 0, 1);

    const monthlyData = await BinDropoff.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                dropoffs: { $sum: 1 },
                kilograms: { $sum: '$kilograms' },
                points: { $sum: '$pointsAwarded' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    if (!monthlyData || monthlyData.length === 0) {
        return {
            trendAnalysis: { dropoffSlope: 0, dropoffRSquared: 0 },
            seasonalAnalysis: { seasonalIndices: [], trend: [] },
            statisticalSummary: { mean: 0, median: 0, mode: 0, min: 0, max: 0, stdDev: 0 },
            outliers: [],
            predictions: [],
            insights: { trendDirection: 'Stable', seasonalityDetected: false, outlierCount: 0, predictionConfidence: 0 }
        };
    }

    const dropoffData = monthlyData.map((item, index) => ({ x: index, y: item.dropoffs }));
    const dropoffRegression = linearRegression(dropoffData);
    const dropoffValues = monthlyData.map(item => item.dropoffs);
    const seasonalAnalysis = seasonalDecomposition(dropoffValues, 12);
    const stats = statisticalSummary(dropoffValues);
    const outliers = detectOutliers(dropoffValues);

    const predictions = [];
    for (let i = 1; i <= 3; i++) {
        const nextIndex = monthlyData.length + i - 1;
        const predictedDropoffs = Math.max(0, Math.round(dropoffRegression.predict(nextIndex)));
        predictions.push({
            month: `Month +${i}`,
            predictedDropoffs,
            confidence: Math.round(dropoffRegression.rSquared * 100)
        });
    }

    return {
        trendAnalysis: {
            dropoffSlope: dropoffRegression.slope,
            dropoffRSquared: dropoffRegression.rSquared
        },
        seasonalAnalysis: {
            seasonalIndices: seasonalAnalysis.seasonal,
            trend: seasonalAnalysis.trend
        },
        statisticalSummary: stats,
        outliers: outliers.map(index => ({
            month: `${monthlyData[index]._id.year}-${String(monthlyData[index]._id.month).padStart(2, '0')}`,
            value: dropoffValues[index],
            deviation: Math.abs(dropoffValues[index] - stats.mean)
        })),
        predictions,
        insights: {
            trendDirection: dropoffRegression.slope > 0 ? 'Increasing' :
                           dropoffRegression.slope < 0 ? 'Decreasing' : 'Stable',
            seasonalityDetected: seasonalAnalysis.seasonal.some(index => Math.abs(index) > stats.stdDev * 0.5),
            outlierCount: outliers.length,
            predictionConfidence: Math.round(dropoffRegression.rSquared * 100)
        }
    };
};

const getRecentDropoffs = async () => {
    return BinDropoff.find()
        .populate('binId', 'name address status')
        .sort({ createdAt: -1 })
        .limit(10);
};

const getDashboardData = asyncHandler(async (req, res) => {
    const [summary, monthlyTrends, dropoffPredictive, recentDropoffs, wasteTypeBreakdown] = await Promise.all([
        getDropoffSummary(),
        getMonthlyDropoffTrends(),
        getDropoffPredictiveAnalytics(),
        getRecentDropoffs(),
        BinDropoff.aggregate([
            { $group: { _id: '$wasteType', count: { $sum: 1 }, totalKg: { $sum: '$kilograms' } } },
            { $sort: { count: -1, _id: 1 } }
        ])
    ]);

    const categoryDistribution = wasteTypeBreakdown.map(item => ({
        name: item._id,
        value: item.count,
        kilograms: Math.round(item.totalKg * 100) / 100
    }));

    const residentCount = await Resident.countDocuments({ status: 'Active' });

    res.json({
        summary: {
            ...summary,
            activeResidents: residentCount
        },
        monthlyTrends,
        categoryDistribution,
        recentDropoffs,
        predictiveAnalytics: dropoffPredictive
    });
});

const getSummaryData = asyncHandler(async (req, res) => {
    const summary = await getDropoffSummary();
    res.json(summary);
});

const getCategoryDistributionData = asyncHandler(async (req, res) => {
    const wasteTypeBreakdown = await BinDropoff.aggregate([
        { $group: { _id: '$wasteType', count: { $sum: 1 }, totalKg: { $sum: '$kilograms' } } },
        { $sort: { count: -1, _id: 1 } }
    ]);

    const categories = wasteTypeBreakdown.map(item => ({
        name: item._id,
        value: item.count,
        kilograms: Math.round(item.totalKg * 100) / 100
    }));

    res.json({ categories });
});

const getMonthlyTrendsData = asyncHandler(async (req, res) => {
    const monthlyTrends = await getMonthlyDropoffTrends();
    res.json({ monthlyTrends });
});

const getPredictiveAnalyticsData = asyncHandler(async (req, res) => {
    const predictiveData = await getDropoffPredictiveAnalytics();
    res.json({ predictiveAnalytics: predictiveData });
});

const getReportData = asyncHandler(async (req, res) => {
    const { timeframe = 'month', wasteType } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (timeframe === 'week') {
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'month') {
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (timeframe === 'year') {
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    let matchQuery = { createdAt: dateFilter };
    if (wasteType && wasteType !== 'All') {
        matchQuery.wasteType = wasteType;
    }

    const [report] = await BinDropoff.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalDropoffs: { $sum: 1 },
                totalKilograms: { $sum: '$kilograms' },
                totalPoints: { $sum: '$pointsAwarded' },
                completedDropoffs: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                uniqueResidents: { $addToSet: '$participantEmail' }
            }
        },
        {
            $project: {
                _id: 0,
                totalDropoffs: 1,
                totalKilograms: 1,
                totalPoints: 1,
                successRate: {
                    $cond: [{ $eq: ['$totalDropoffs', 0] }, 0, { $multiply: [{ $divide: ['$completedDropoffs', '$totalDropoffs'] }, 100] }]
                },
                uniqueResidents: { $size: '$uniqueResidents' }
            }
        }
    ]);

    const summaryByWasteType = await BinDropoff.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$wasteType',
                count: { $sum: 1 },
                totalKg: { $sum: '$kilograms' },
                totalPoints: { $sum: '$pointsAwarded' }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    const weeklyTrend = await BinDropoff.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const recentActivity = await BinDropoff.find(matchQuery)
        .sort({ createdAt: -1 })
        .limit(10);

    res.json({
        summary: report || { totalDropoffs: 0, totalKilograms: 0, totalPoints: 0, successRate: 0, uniqueResidents: 0 },
        summaryByWasteType,
        weeklyTrend,
        recentActivity
    });
});

module.exports = {
    getSummaryData,
    getCategoryDistributionData,
    getMonthlyTrendsData,
    getPredictiveAnalyticsData,
    getDashboardData,
    getReportData
};
