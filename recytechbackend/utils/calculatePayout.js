const ExchangeRate = require('../models/ExchangeRate');

/**
 * Calculate payout amount based on waste type and weight
 * @param {string} wasteType - Type of waste (e.g., "Electronics", "Battery")
 * @param {number} weight - Weight in kilograms
 * @returns {object} { amount: number, success: boolean, message: string }
 */
async function calculatePayoutAmount(wasteType, weight) {
    try {
        // Validate inputs
        if (!wasteType || typeof wasteType !== 'string') {
            return {
                amount: 0,
                success: false,
                message: 'Invalid waste type provided'
            };
        }

        if (!weight || typeof weight !== 'number' || weight < 0) {
            return {
                amount: 0,
                success: false,
                message: 'Invalid weight provided'
            };
        }

        // If weight is 0, payout is 0
        if (weight === 0) {
            return {
                amount: 0,
                success: true,
                message: 'Zero weight - no payout'
            };
        }

        // Find exchange rate for this waste type
        const exchangeRate = await ExchangeRate.findOne({
            wasteType: wasteType.trim(),
            isActive: true
        });

        if (!exchangeRate) {
            return {
                amount: 0,
                success: false,
                message: `No active exchange rate found for waste type: ${wasteType}`
            };
        }

        // Calculate payout: weight x rate per kg
        const payout = weight * exchangeRate.ratePerKg;

        // Round to 2 decimal places (cents)
        const roundedPayout = Math.round(payout * 100) / 100;

        return {
            amount: roundedPayout,
            success: true,
            message: `Payout calculated: ${weight}kg x PHP ${exchangeRate.ratePerKg}/kg = PHP ${roundedPayout}`,
            exchangeRate: exchangeRate.ratePerKg
        };
    } catch (error) {
        console.error('Error calculating payout:', error);
        return {
            amount: 0,
            success: false,
            message: `Error calculating payout: ${error.message}`
        };
    }
}

module.exports = {
    calculatePayoutAmount
};
