const {
    getCollectionForecast,
    getSchedulingRecommendations,
    confirmCollectorAssignments
} = require('../services/schedulingService');
const { asyncHandler } = require('../utils/asyncHandler');

const getForecast = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 7;
    const forecast = await getCollectionForecast(days);
    res.json(forecast);
});

const getRecommendations = asyncHandler(async (req, res) => {
    const recommendations = await getSchedulingRecommendations();
    res.json(recommendations);
});

const confirmAssignments = asyncHandler(async (req, res) => {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
        res.status(400);
        throw new Error('No assignments provided.');
    }

    const confirmationResult = await confirmCollectorAssignments(assignments);
    res.json(confirmationResult);
});

module.exports = {
    getForecast,
    getRecommendations,
    confirmAssignments
};
