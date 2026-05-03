const ExchangeRate = require('../models/ExchangeRate');

/**
 * Calculate payout amount based on waste type and quantity
 * @param {string} wasteType - Type of waste (e.g., "Electronics", "Battery")
 * @param {number} quantity - Number of items/units
 * @returns {object} { amount: number, success: boolean, message: string }
 */
async function calculatePayoutAmount(wasteType, quantity = 1) {
    try {
        // Validate inputs
        if (!wasteType || typeof wasteType !== 'string') {
            return {
                amount: 0,
                success: false,
                message: 'Invalid waste type provided'
            };
        }

        if (!Number.isFinite(quantity) || quantity < 1) {
            return {
                amount: 0,
                success: false,
                message: 'Invalid quantity provided'
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

        const rate = exchangeRate.ratePerItem ?? exchangeRate.ratePerKg;

        if (!Number.isFinite(rate) || rate < 0) {
            return {
                amount: 0,
                success: false,
                message: `No valid item rate found for waste type: ${wasteType}`
            };
        }

        // Calculate payout: quantity x rate per item
        const payout = quantity * rate;

        // Round to 2 decimal places (cents)
        const roundedPayout = Math.round(payout * 100) / 100;

        return {
            amount: roundedPayout,
            success: true,
            message: `Payout calculated: ${quantity} item(s) x PHP ${rate}/item = PHP ${roundedPayout}`,
            exchangeRate: rate
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
