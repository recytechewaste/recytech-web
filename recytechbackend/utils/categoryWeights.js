/**
 * Category-based average weight benchmarks (in kg).
 * Standard reference weights used when hardware scales are not present.
 */

const CATEGORY_BENCHMARK_WEIGHTS = {
    'Laptop': 2.00,
    'Lamp': 0.80,
    'Keyboard': 0.60,
    'Clock': 0.30,
    'Powerbank': 0.25,
    'Headphones': 0.20,
    'Flashlight': 0.20,
    'Smartphone': 0.18,
    'Calculator': 0.15,
    'Cables & Chargers': 0.15,
    'Mouse': 0.10,
    'Batteries': 0.05,
    'Other E-Waste': 0.30
};

const DEFAULT_CATEGORY_WEIGHT = 0.30;

/**
 * Standard Canonical Category Names across RecyTech.
 * Prevents duplicates in charts, filters, and analytics.
 */
const CANONICAL_CATEGORIES = [
    'Laptop',
    'Smartphone',
    'Batteries',
    'Keyboard',
    'Cables & Chargers',
    'Mouse',
    'Headphones',
    'Powerbank',
    'Flashlight',
    'Lamp',
    'Calculator',
    'Clock',
    'Other E-Waste'
];

/**
 * Normalizes any category string (from YOLOv8, user dropoff, or collector)
 * into a single unified canonical name.
 * 
 * @param {string} rawCategory
 * @returns {string} Canonical category name
 */
function normalizeWasteCategory(rawCategory) {
    if (!rawCategory || typeof rawCategory !== 'string') {
        return 'Other E-Waste';
    }

    const clean = rawCategory.trim().toLowerCase();

    if (/laptop|notebook|netbook/i.test(clean)) return 'Laptop';
    if (/smart\s*phone|phone|mobile|cellphone/i.test(clean)) return 'Smartphone';
    if (/batter/i.test(clean)) return 'Batteries';
    if (/keyboard/i.test(clean)) return 'Keyboard';
    if (/cable|charger|wire|cord|adapter/i.test(clean)) return 'Cables & Chargers';
    if (/mouse|mice/i.test(clean)) return 'Mouse';
    if (/headphone|earphone|headset|earbud/i.test(clean)) return 'Headphones';
    if (/power\s*bank/i.test(clean)) return 'Powerbank';
    if (/flashlight|torch/i.test(clean)) return 'Flashlight';
    if (/lamp|light\s*bulb/i.test(clean)) return 'Lamp';
    if (/calculator/i.test(clean)) return 'Calculator';
    if (/clock/i.test(clean)) return 'Clock';

    return 'Other E-Waste';
}

/**
 * JS helper to get estimated weight in kg for a given category and quantity.
 */
function getEstimatedWeight(category, quantity = 1) {
    const qty = Math.max(0, Number(quantity) || 1);
    const canonical = normalizeWasteCategory(category);
    const benchmark = CATEGORY_BENCHMARK_WEIGHTS[canonical] || DEFAULT_CATEGORY_WEIGHT;
    return Math.round(benchmark * qty * 100) / 100;
}

/**
 * MongoDB Aggregation expression helper to map any raw category field into its canonical name.
 * This guarantees duplicate labels (e.g. 'cables', 'Cable', 'Charger', 'Cables & Chargers')
 * collapse into a single unified bucket inside MongoDB `$group` stages.
 */
function getMongoCanonicalCategoryExpr(categoryField) {
    const input = { $ifNull: [categoryField, ''] };
    return {
        $switch: {
            branches: [
                { case: { $regexMatch: { input, regex: /laptop|notebook|netbook/i } }, then: 'Laptop' },
                { case: { $regexMatch: { input, regex: /smart\s*phone|phone|mobile|cellphone/i } }, then: 'Smartphone' },
                { case: { $regexMatch: { input, regex: /batter/i } }, then: 'Batteries' },
                { case: { $regexMatch: { input, regex: /keyboard/i } }, then: 'Keyboard' },
                { case: { $regexMatch: { input, regex: /cable|charger|wire|cord|adapter/i } }, then: 'Cables & Chargers' },
                { case: { $regexMatch: { input, regex: /mouse|mice/i } }, then: 'Mouse' },
                { case: { $regexMatch: { input, regex: /headphone|earphone|headset|earbud/i } }, then: 'Headphones' },
                { case: { $regexMatch: { input, regex: /power\s*bank/i } }, then: 'Powerbank' },
                { case: { $regexMatch: { input, regex: /flashlight|torch/i } }, then: 'Flashlight' },
                { case: { $regexMatch: { input, regex: /lamp|light\s*bulb/i } }, then: 'Lamp' },
                { case: { $regexMatch: { input, regex: /calculator/i } }, then: 'Calculator' },
                { case: { $regexMatch: { input, regex: /clock/i } }, then: 'Clock' }
            ],
            default: 'Other E-Waste'
        }
    };
}

/**
 * MongoDB Aggregation expression helper to compute estimated kg.
 * Multiplies quantityField by standard category weight.
 */
function getMongoCategoryWeightExpr(categoryField, quantityField) {
    const input = { $ifNull: [categoryField, ''] };
    return {
        $multiply: [
            { $ifNull: [quantityField, 1] },
            {
                $switch: {
                    branches: [
                        { case: { $regexMatch: { input, regex: /laptop|notebook|netbook/i } }, then: 2.00 },
                        { case: { $regexMatch: { input, regex: /lamp|light\s*bulb/i } }, then: 0.80 },
                        { case: { $regexMatch: { input, regex: /keyboard/i } }, then: 0.60 },
                        { case: { $regexMatch: { input, regex: /clock/i } }, then: 0.30 },
                        { case: { $regexMatch: { input, regex: /power\s*bank/i } }, then: 0.25 },
                        { case: { $regexMatch: { input, regex: /headphone|earphone|headset|earbud/i } }, then: 0.20 },
                        { case: { $regexMatch: { input, regex: /flashlight|torch/i } }, then: 0.20 },
                        { case: { $regexMatch: { input, regex: /smart\s*phone|phone|mobile|cellphone/i } }, then: 0.18 },
                        { case: { $regexMatch: { input, regex: /calculator/i } }, then: 0.15 },
                        { case: { $regexMatch: { input, regex: /cable|charger|wire|cord|adapter/i } }, then: 0.15 },
                        { case: { $regexMatch: { input, regex: /mouse|mice/i } }, then: 0.10 },
                        { case: { $regexMatch: { input, regex: /batter/i } }, then: 0.05 }
                    ],
                    default: DEFAULT_CATEGORY_WEIGHT
                }
            }
        ]
    };
}

module.exports = {
    CATEGORY_BENCHMARK_WEIGHTS,
    CANONICAL_CATEGORIES,
    DEFAULT_CATEGORY_WEIGHT,
    normalizeWasteCategory,
    getEstimatedWeight,
    getMongoCanonicalCategoryExpr,
    getMongoCategoryWeightExpr
};
