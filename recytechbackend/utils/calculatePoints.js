const RewardPoint = require('../models/RewardPoint');

/**
 * Calculate points awarded based on waste type and deposited items.
 * @param {string} wasteType - Type of waste (e.g. "Electronics", "Battery")
 * @param {number} items - Number of deposited waste items
 * @returns {object} { points: number, success: boolean, message: string }
 */
async function calculatePointsAwarded(wasteType, items = 1) { // Changed kilograms to items
    try {
        if (!wasteType || typeof wasteType !== 'string') {
            return {
                points: 0,
                success: false,
                message: 'Invalid waste type provided'
            };
        }

        if (!Number.isFinite(items) || items < 0) { // Changed kilograms to items
            return {
                points: 0,
                success: false,
                message: 'Invalid kilogram value provided'
            };
        }

        const rewardPoint = await RewardPoint.findOne({
            wasteType: wasteType.trim(),
            isActive: true
        });

        if (!rewardPoint) {
            return {
                points: 0,
                success: false,
                message: `No active reward rule found for waste type: ${wasteType}`
            };
        }

        const pointsPerItem = rewardPoint.pointsPerItem; // Corrected from pointsPerKg

        if (!Number.isFinite(pointsPerItem) || pointsPerItem < 0) { // Corrected from pointsPerKg
            return {
                points: 0,
                success: false,
                message: `No valid points rule found for waste type: ${wasteType} or pointsPerItem is invalid` // Updated message
            };
        }

        const calculatedPoints = items * pointsPerItem; // Corrected from kilograms * pointsPerKg
        const roundedPoints = Math.round(calculatedPoints);

        return {
            points: roundedPoints,
            success: true,
            message: `Points calculated: ${items} items x ${pointsPerItem} points/item = ${roundedPoints} points`, // Updated message
            pointsPerItem: pointsPerItem // Corrected from pointsPerKg
        };
    } catch (error) {
        console.error('Error calculating points:', error);
        return {
            points: 0,
            success: false,
            message: `Error calculating points: ${error.message}`
        };
    }
}

module.exports = {
    calculatePointsAwarded
};
