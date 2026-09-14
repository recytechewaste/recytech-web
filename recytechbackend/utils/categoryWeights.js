/**
 * Category-based average weight benchmarks (in kg).
 * Standard reference weights used when hardware scales are not present.
 */

const CATEGORY_BENCHMARK_WEIGHTS = {
    laptop: 2.00,
    lamp: 0.80,
    keyboard: 0.60,
    clock: 0.30,
    powerbank: 0.25,
    headphone: 0.20,
    flashlight: 0.20,
    smartphone: 0.18,
    calculator: 0.15,
    cable: 0.15,
    mouse: 0.10,
    battery: 0.05
};

const DEFAULT_CATEGORY_WEIGHT = 0.30;

/**
 * JS helper to get estimated weight in kg for a given category and quantity.
 */
function getEstimatedWeight(category, quantity = 1) {
    const qty = Math.max(0, Number(quantity) || 1);
    if (!category || typeof category !== 'string') {
        return Math.round(DEFAULT_CATEGORY_WEIGHT * qty * 100) / 100;
    }

    const lower = category.trim().toLowerCase();

    if (/laptop/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.laptop * qty * 100) / 100;
    if (/lamp/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.lamp * qty * 100) / 100;
    if (/keyboard/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.keyboard * qty * 100) / 100;
    if (/clock/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.clock * qty * 100) / 100;
    if (/power\s*bank/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.powerbank * qty * 100) / 100;
    if (/headphone|earphone/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.headphone * qty * 100) / 100;
    if (/flashlight/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.flashlight * qty * 100) / 100;
    if (/smart\s*phone|phone|mobile/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.smartphone * qty * 100) / 100;
    if (/calculator/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.calculator * qty * 100) / 100;
    if (/cable|charger|wire/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.cable * qty * 100) / 100;
    if (/mouse|mice/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.mouse * qty * 100) / 100;
    if (/batter/i.test(lower)) return Math.round(CATEGORY_BENCHMARK_WEIGHTS.battery * qty * 100) / 100;

    return Math.round(DEFAULT_CATEGORY_WEIGHT * qty * 100) / 100;
}

/**
 * MongoDB Aggregation expression helper to compute estimated kg.
 * Multiplies quantityField by standard category weight.
 */
function getMongoCategoryWeightExpr(categoryField, quantityField) {
    return {
        $multiply: [
            { $ifNull: [quantityField, 1] },
            {
                $switch: {
                    branches: [
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /laptop/i } }, then: 2.00 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /lamp/i } }, then: 0.80 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /keyboard/i } }, then: 0.60 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /clock/i } }, then: 0.30 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /power\s*bank/i } }, then: 0.25 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /headphone|earphone/i } }, then: 0.20 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /flashlight/i } }, then: 0.20 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /(smart\s*phone|phone|mobile)/i } }, then: 0.18 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /calculator/i } }, then: 0.15 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /(cable|charger|wire)/i } }, then: 0.15 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /mouse|mice/i } }, then: 0.10 },
                        { case: { $regexMatch: { input: { $ifNull: [categoryField, ''] }, regex: /batter/i } }, then: 0.05 }
                    ],
                    default: DEFAULT_CATEGORY_WEIGHT
                }
            }
        ]
    };
}

module.exports = {
    CATEGORY_BENCHMARK_WEIGHTS,
    DEFAULT_CATEGORY_WEIGHT,
    getEstimatedWeight,
    getMongoCategoryWeightExpr
};
