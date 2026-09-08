const RewardPoint = require('../models/RewardPoint');

/**
 * Calculate points awarded based on waste type and deposited items.
 * Uses smart matching (exact match, case-insensitive match, and category substring matching)
 * so that mobile waste types like "Small Electronics", "Batteries", etc. reliably map
 * to the admin-configured RewardPoint rules.
 * @param {string} wasteType - Type of waste (e.g. "Electronics", "Small Electronics", "Battery")
 * @param {number} items - Number of deposited waste items
 * @returns {object} { points: number, success: boolean, message: string, matchedWasteType: string, pointsPerItem: number }
 */
async function calculatePointsAwarded(wasteType, items = 1) {
    try {
        if (!wasteType || typeof wasteType !== 'string') {
            return {
                points: 0,
                success: false,
                message: 'Invalid waste type provided'
            };
        }

        const count = Number(items);
        if (!Number.isFinite(count) || count < 0) {
            return {
                points: 0,
                success: false,
                message: 'Invalid item count provided'
            };
        }

        const trimmed = wasteType.trim();

        // 1. Exact match
        let rewardPoint = await RewardPoint.findOne({
            wasteType: trimmed,
            isActive: true
        });

        // 2. Case-insensitive exact match
        if (!rewardPoint) {
            const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            rewardPoint = await RewardPoint.findOne({
                wasteType: { $regex: new RegExp(`^${escaped}$`, 'i') },
                isActive: true
            });
        }

        // 3. Smart substring / semantic match with plural normalization
        // e.g. "Small Electronics" matches "Electronics", "Batteries" matches "Battery", "Mobile" matches "Mobile Phone"
        if (!rewardPoint) {
            const allActive = await RewardPoint.find({ isActive: true });
            const targetLower = trimmed.toLowerCase();
            const stem = (str) => {
                let s = str.toLowerCase().trim();
                if (s.endsWith('ies')) s = s.slice(0, -3) + 'y';
                else if (s.endsWith('es')) s = s.slice(0, -2);
                else if (s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
                return s;
            };
            const targetStem = stem(targetLower);

            rewardPoint = allActive.find(rp => {
                const rpLower = rp.wasteType.toLowerCase();
                const rpStem = stem(rpLower);
                return targetLower.includes(rpLower) || 
                       rpLower.includes(targetLower) ||
                       targetStem.includes(rpStem) ||
                       rpStem.includes(targetStem);
            });
        }

        if (!rewardPoint) {
            return {
                points: 0,
                success: false,
                message: `No active reward rule found for waste type: ${wasteType}`
            };
        }

        const pointsPerItem = rewardPoint.pointsPerItem ?? rewardPoint.pointsPerKg ?? 0;
        const calculatedPoints = Math.round(count * pointsPerItem);

        return {
            points: calculatedPoints,
            success: true,
            matchedWasteType: rewardPoint.wasteType,
            pointsPerItem,
            message: `Points calculated: ${count} items x ${pointsPerItem} points/item = ${calculatedPoints} points`
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
