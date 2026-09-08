require('../models/PartnerOrganization');
require('../models/Collector');
const BinDropoff = require('../models/BinDropoff');
const RecyclingCenter = require('../models/RecyclingCenter');
const Resident = require('../models/Resident');
const Request = require('../models/Request');
const { LguAccount } = require('../models/PartnerOrganization');
const { asyncHandler } = require('../utils/asyncHandler');
const { linearRegression, seasonalDecomposition, statisticalSummary, detectOutliers, holtExponentialSmoothing } = require('../utils/predictiveAnalytics');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Helper to combine waste type breakdowns from resident drop-offs and completed collector requests.
 */
const getCombinedWasteTypeBreakdown = async (matchQueryBin = {}, matchQueryRequest = {}) => {
    const [binBreakdown, reqBreakdown] = await Promise.all([
        BinDropoff.aggregate([
            ...(Object.keys(matchQueryBin).length > 0 ? [{ $match: matchQueryBin }] : []),
            { $group: { _id: '$wasteType', count: { $sum: 1 }, totalKg: { $sum: '$kilograms' }, totalPoints: { $sum: '$pointsAwarded' } } }
        ]),
        Request.aggregate([
            { $match: { status: { $in: ['completed', 'Completed'] }, ...matchQueryRequest } },
            { $unwind: { path: '$collectedWaste', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$collectedWaste.category',
                    count: { $sum: 1 },
                    totalKg: { $sum: '$collectedWaste.quantity' },
                    totalPoints: { $sum: 0 }
                }
            }
        ])
    ]);

    const combinedMap = {};
    binBreakdown.forEach(item => {
        if (!item._id) return;
        combinedMap[item._id] = {
            _id: item._id,
            count: item.count || 0,
            totalKg: item.totalKg || 0,
            totalPoints: item.totalPoints || 0
        };
    });

    reqBreakdown.forEach(item => {
        if (!item._id) return;
        if (!combinedMap[item._id]) {
            combinedMap[item._id] = { _id: item._id, count: 0, totalKg: 0, totalPoints: 0 };
        }
        combinedMap[item._id].count += item.count || 0;
        combinedMap[item._id].totalKg += item.totalKg || 0;
        combinedMap[item._id].totalPoints += item.totalPoints || 0;
    });

    return Object.values(combinedMap).sort((a, b) => (b.totalKg - a.totalKg) || (b.count - a.count));
};

const getDropoffSummary = async () => {
    const [totals, reqTotals, wasteTypeBreakdown, binStats, pendingRequestsCount, completedReqCount] = await Promise.all([
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
        Request.aggregate([
            { $match: { status: { $in: ['completed', 'Completed'] } } },
            { $unwind: { path: '$collectedWaste', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: null,
                    totalKg: { $sum: '$collectedWaste.quantity' }
                }
            }
        ]),
        getCombinedWasteTypeBreakdown(),
        RecyclingCenter.aggregate([
            {
                $group: {
                    _id: null,
                    totalBins: { $sum: 1 },
                    operationalBins: { $sum: { $cond: [{ $ne: ['$status', 'Maintenance'] }, 1, 0] } },
                    nearCapacity: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$status', 'Full'] },
                                        { $and: [{ $gt: ['$capacityKg', 0] }, { $gte: [{ $divide: ['$currentFillKg', '$capacityKg'] }, 0.8] }] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        Request.countDocuments({ status: { $in: ['pending', 'Pending'] } }),
        Request.countDocuments({ status: { $in: ['completed', 'Completed'] } })
    ]);

    const dropoffTotals = totals[0] || { totalDropoffs: 0, totalKilograms: 0, totalPoints: 0 };
    const requestCollectedKg = reqTotals[0]?.totalKg || 0;
    const bins = binStats[0] || { totalBins: 0, operationalBins: 0, nearCapacity: 0 };
    const topWasteType = wasteTypeBreakdown[0] || { _id: 'N/A' };

    const totalKilograms = Math.round(((dropoffTotals.totalKilograms || 0) + requestCollectedKg) * 100) / 100;
    const totalDropoffs = (dropoffTotals.totalDropoffs || 0) + completedReqCount;

    return {
        totalDropoffs,
        totalKilograms,
        totalPoints: Math.round(dropoffTotals.totalPoints * 100) / 100,
        totalBins: bins.totalBins,
        operationalBins: bins.operationalBins,
        binsNearCapacity: bins.nearCapacity,
        pendingRequests: pendingRequestsCount,
        topWasteType: topWasteType._id
    };
};

const getMonthlyDropoffTrends = async () => {
    const targetYear = new Date().getFullYear();
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);

    const [dropoffTrends, requestTrends] = await Promise.all([
        BinDropoff.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    dropoffs: { $sum: 1 },
                    kilograms: { $sum: '$kilograms' },
                    points: { $sum: '$pointsAwarded' }
                }
            }
        ]),
        Request.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'Completed'] },
                    $or: [
                        { completionDate: { $gte: start, $lt: end } },
                        { createdAt: { $gte: start, $lt: end } }
                    ]
                }
            },
            {
                $project: {
                    month: { $month: { $ifNull: ['$completionDate', '$createdAt'] } },
                    totalWasteKg: { $sum: '$collectedWaste.quantity' }
                }
            },
            {
                $group: {
                    _id: { month: '$month' },
                    collections: { $sum: 1 },
                    kilograms: { $sum: '$totalWasteKg' }
                }
            }
        ])
    ]);

    const trendMap = {};
    dropoffTrends.forEach(item => {
        trendMap[item._id.month] = {
            dropoffs: item.dropoffs || 0,
            kilograms: item.kilograms || 0,
            points: item.points || 0
        };
    });

    requestTrends.forEach(item => {
        const m = item._id.month;
        if (!trendMap[m]) {
            trendMap[m] = { dropoffs: 0, kilograms: 0, points: 0 };
        }
        trendMap[m].dropoffs += item.collections || 0;
        trendMap[m].kilograms += item.kilograms || 0;
    });

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

    const [monthlyDropoffs, monthlyRequests] = await Promise.all([
        BinDropoff.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    dropoffs: { $sum: 1 },
                    kilograms: { $sum: '$kilograms' },
                    points: { $sum: '$pointsAwarded' }
                }
            }
        ]),
        Request.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'Completed'] },
                    $or: [
                        { completionDate: { $gte: start, $lt: end } },
                        { createdAt: { $gte: start, $lt: end } }
                    ]
                }
            },
            {
                $project: {
                    year: { $year: { $ifNull: ['$completionDate', '$createdAt'] } },
                    month: { $month: { $ifNull: ['$completionDate', '$createdAt'] } },
                    totalWasteKg: { $sum: '$collectedWaste.quantity' }
                }
            },
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    collections: { $sum: 1 },
                    kilograms: { $sum: '$totalWasteKg' }
                }
            }
        ])
    ]);

    const combinedMonthlyMap = {};
    monthlyDropoffs.forEach(item => {
        const key = `${item._id.year}-${item._id.month}`;
        combinedMonthlyMap[key] = {
            _id: item._id,
            dropoffs: item.dropoffs || 0,
            kilograms: item.kilograms || 0,
            points: item.points || 0
        };
    });

    monthlyRequests.forEach(item => {
        const key = `${item._id.year}-${item._id.month}`;
        if (!combinedMonthlyMap[key]) {
            combinedMonthlyMap[key] = {
                _id: item._id,
                dropoffs: 0,
                kilograms: 0,
                points: 0
            };
        }
        combinedMonthlyMap[key].dropoffs += item.collections || 0;
        combinedMonthlyMap[key].kilograms += item.kilograms || 0;
    });

    const monthlyData = Object.values(combinedMonthlyMap).sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
    });

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

    const holt = holtExponentialSmoothing(dropoffValues, 0.3, 0.2);

    const predictions = [];
    for (let i = 1; i <= 3; i++) {
        const ci = holt.confidenceInterval(i, 1.645);
        predictions.push({
            month: `Month +${i}`,
            predictedDropoffs: ci.point,
            lowerBound: ci.lower,
            upperBound: ci.upper,
            confidence: Math.round(dropoffRegression.rSquared * 100)
        });
    }

    const trendDirection = holt.trend > 0.5 ? 'Increasing' :
                           holt.trend < -0.5 ? 'Decreasing' : 'Stable';

    return {
        trendAnalysis: {
            dropoffSlope: holt.trend,
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
            trendDirection,
            seasonalityDetected: seasonalAnalysis.seasonal.some(index => Math.abs(index) > stats.stdDev * 0.5),
            outlierCount: outliers.length,
            predictionConfidence: Math.min(95, Math.max(30, Math.round(dropoffRegression.rSquared * 100 || (dropoffValues.length >= 3 ? 75 : 40))))
        }
    };
};

const getRecentDropoffs = async () => {
    const [binDropoffs, completedRequests] = await Promise.all([
        BinDropoff.find()
            .populate('binId', 'name address status')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        Request.find({ status: { $in: ['completed', 'Completed'] } })
            .populate({ path: 'lgu', select: 'name' })
            .populate({ path: 'assignedCollector', select: 'firstName lastName' })
            .sort({ completionDate: -1, createdAt: -1 })
            .limit(10)
            .lean()
    ]);

    const normalizedRequests = completedRequests.map(r => {
        const totalKg = (r.collectedWaste || []).reduce((sum, w) => sum + (w.quantity || 0), 0);
        const wasteType = (r.collectedWaste || []).map(w => w.category).join(', ') || 'General E-Waste';
        const partnerName = r.lgu?.name || 'Partner Org';
        const collectorName = r.assignedCollector ? `${r.assignedCollector.firstName} ${r.assignedCollector.lastName}` : '';
        const participantName = collectorName ? `${partnerName} (${collectorName})` : partnerName;

        return {
            _id: r._id,
            participantName,
            wasteType,
            kilograms: Math.round(totalKg * 100) / 100,
            pointsAwarded: 0,
            createdAt: r.completionDate || r.createdAt
        };
    });

    const combined = [...binDropoffs, ...normalizedRequests];
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined.slice(0, 10);
};

const getDashboardData = asyncHandler(async (req, res) => {
    const [summary, monthlyTrends, dropoffPredictive, recentDropoffs, wasteTypeBreakdown] = await Promise.all([
        getDropoffSummary(),
        getMonthlyDropoffTrends(),
        getDropoffPredictiveAnalytics(),
        getRecentDropoffs(),
        getCombinedWasteTypeBreakdown()
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
    const wasteTypeBreakdown = await getCombinedWasteTypeBreakdown();

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
    const { timeframe = 'month', wasteType, lguId } = req.query;

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

    // LGU-specific filtering: restrict to bins belonging to the selected LGU
    let lguBinIds = null;
    let requestLguFilter = {};
    if (lguId && lguId !== 'All') {
        const lguBins = await RecyclingCenter.find({ assignedLgu: lguId }).select('_id').lean();
        lguBinIds = lguBins.map(b => b._id);
        matchQuery.bin = { $in: lguBinIds };
        requestLguFilter.lgu = lguId;
    }

    const requestDateFilter = {
        $or: [
            { completionDate: dateFilter },
            { createdAt: dateFilter }
        ]
    };

    const completedRequestMatch = {
        ...requestDateFilter,
        ...requestLguFilter,
        status: { $in: ['completed', 'Completed'] }
    };

    // Fetch all available LGU accounts for the filter dropdown
    const lguAccounts = await LguAccount.find({}).select('_id name').lean();

    const [reportResults, requestResults, binResults, reqWasteTotals] = await Promise.all([
        BinDropoff.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalDropoffs: { $sum: 1 },
                    totalKilograms: { $sum: '$kilograms' },
                    totalPoints: { $sum: '$pointsAwarded' },
                    completedDropoffs: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDropoffs: 1,
                    totalKilograms: 1,
                    totalPoints: 1,
                    completedDropoffs: 1
                }
            }
        ]),
        Request.aggregate([
            { $match: { ...requestDateFilter, ...requestLguFilter } },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    completedRequests: {
                        $sum: { $cond: [{ $in: ['$status', ['completed', 'Completed']] }, 1, 0] }
                    }
                }
            }
        ]),
        RecyclingCenter.aggregate([
            ...(lguBinIds ? [{ $match: { _id: { $in: lguBinIds } } }] : []),
            {
                $group: {
                    _id: null,
                    totalBins: { $sum: 1 },
                    activeBins: { $sum: { $cond: [{ $ne: ['$status', 'Maintenance'] }, 1, 0] } }
                }
            }
        ]),
        Request.aggregate([
            { $match: completedRequestMatch },
            { $unwind: { path: '$collectedWaste', preserveNullAndEmptyArrays: false } },
            ...(wasteType && wasteType !== 'All' ? [{ $match: { 'collectedWaste.category': wasteType } }] : []),
            {
                $group: {
                    _id: null,
                    totalKilograms: { $sum: '$collectedWaste.quantity' }
                }
            }
        ])
    ]);

    const report = reportResults[0] || { totalDropoffs: 0, totalKilograms: 0, totalPoints: 0, completedDropoffs: 0 };
    const reqStats = requestResults[0] || { totalRequests: 0, completedRequests: 0 };
    const bStats = binResults[0] || { totalBins: 0, activeBins: 0 };
    const reqWasteKg = reqWasteTotals[0]?.totalKilograms || 0;

    const totalCompletedReq = reqStats.completedRequests || 0;
    const totalDropoffs = (report.totalDropoffs || 0) + totalCompletedReq;
    const totalKilograms = Math.round(((report.totalKilograms || 0) + reqWasteKg) * 100) / 100;
    const totalCompletedEvents = (report.completedDropoffs || 0) + totalCompletedReq;
    const successRate = totalDropoffs > 0 ? Math.round((totalCompletedEvents / totalDropoffs) * 100) : 0;

    // Summary by Waste Type
    const [binWasteBreakdown, reqWasteBreakdown] = await Promise.all([
        BinDropoff.aggregate([
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
        ]),
        Request.aggregate([
            { $match: completedRequestMatch },
            { $unwind: { path: '$collectedWaste', preserveNullAndEmptyArrays: false } },
            ...(wasteType && wasteType !== 'All' ? [{ $match: { 'collectedWaste.category': wasteType } }] : []),
            {
                $group: {
                    _id: '$collectedWaste.category',
                    count: { $sum: 1 },
                    totalKg: { $sum: '$collectedWaste.quantity' },
                    totalPoints: { $sum: 0 }
                }
            },
            { $sort: { count: -1 } }
        ])
    ]);

    const wasteMap = {};
    binWasteBreakdown.forEach(item => {
        if (!item._id) return;
        wasteMap[item._id] = { _id: item._id, count: item.count || 0, totalKg: item.totalKg || 0, totalPoints: item.totalPoints || 0 };
    });
    reqWasteBreakdown.forEach(item => {
        if (!item._id) return;
        if (!wasteMap[item._id]) {
            wasteMap[item._id] = { _id: item._id, count: 0, totalKg: 0, totalPoints: 0 };
        }
        wasteMap[item._id].count += item.count || 0;
        wasteMap[item._id].totalKg += item.totalKg || 0;
    });
    const summaryByWasteType = Object.values(wasteMap).sort((a, b) => b.count - a.count || b.totalKg - a.totalKg);

    // Weekly / Daily Trend
    const [binWeeklyTrend, reqWeeklyTrend] = await Promise.all([
        BinDropoff.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Request.aggregate([
            { $match: completedRequestMatch },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: { $ifNull: ['$completionDate', '$createdAt'] }
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    const trendDateMap = {};
    binWeeklyTrend.forEach(d => {
        trendDateMap[d._id] = (trendDateMap[d._id] || 0) + d.count;
    });
    reqWeeklyTrend.forEach(d => {
        trendDateMap[d._id] = (trendDateMap[d._id] || 0) + d.count;
    });
    const weeklyTrend = Object.keys(trendDateMap)
        .sort()
        .map(dateKey => ({ _id: dateKey, count: trendDateMap[dateKey] }));

    // Recent Activity
    const [binRecent, reqRecent] = await Promise.all([
        BinDropoff.find(matchQuery)
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        Request.find(completedRequestMatch)
            .populate('lgu', 'name')
            .populate('assignedCollector', 'firstName lastName')
            .sort({ completionDate: -1, createdAt: -1 })
            .limit(10)
            .lean()
    ]);

    const formattedReqRecent = reqRecent.map(r => {
        const totalKg = (r.collectedWaste || []).reduce((acc, w) => acc + (w.quantity || 0), 0);
        const categories = (r.collectedWaste || []).map(w => w.category).join(', ') || 'General E-Waste';
        return {
            _id: r._id,
            createdAt: r.completionDate || r.createdAt,
            wasteType: categories,
            kilograms: Math.round(totalKg * 100) / 100,
            pointsAwarded: 0,
            status: 'Completed'
        };
    });

    const recentActivity = [...binRecent, ...formattedReqRecent];
    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        summary: {
            totalDropoffs,
            totalKilograms,
            totalPoints: report.totalPoints || 0,
            successRate,
            totalRequests: reqStats.totalRequests,
            completedRequests: reqStats.completedRequests,
            totalBins: bStats.totalBins,
            activeBins: bStats.activeBins
        },
        summaryByWasteType,
        weeklyTrend,
        recentActivity: recentActivity.slice(0, 10),
        lguAccounts
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
