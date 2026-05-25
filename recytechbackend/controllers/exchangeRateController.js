const ExchangeRate = require('../models/ExchangeRate');
const { asyncHandler } = require('../utils/asyncHandler');

const getExchangeRates = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';

    let query = {};
    if (!includeInactive) {
        query.isActive = true;
    }

    const rates = await ExchangeRate.find(query).sort({ wasteType: 1 });

    res.json({
        rates,
        count: rates.length
    });
});

const getExchangeRateById = asyncHandler(async (req, res) => {
    const rate = await ExchangeRate.findById(req.params.id);

    if (!rate) {
        res.status(404);
        throw new Error('Exchange rate not found');
    }

    res.json(rate);
});

const createExchangeRate = asyncHandler(async (req, res) => {
    const { wasteType, ratePerItem, ratePerKg, description, isActive } = req.body;
    const itemRate = ratePerItem ?? ratePerKg;

    // Validation
    if (!wasteType || itemRate === undefined) {
        res.status(400);
        throw new Error('wasteType and ratePerItem are required');
    }

    if (typeof itemRate !== 'number' || itemRate < 0) {
        res.status(400);
        throw new Error('ratePerItem must be a non-negative number');
    }

    // Check if waste type already exists
    const existingRate = await ExchangeRate.findOne({
        wasteType: wasteType.trim()
    });

    if (existingRate) {
        res.status(409);
        throw new Error(`Exchange rate for "${wasteType}" already exists`);
    }

    const newRate = await ExchangeRate.create({
        wasteType: wasteType.trim(),
        ratePerItem: itemRate,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
        message: 'Exchange rate created successfully',
        rate: newRate
    });
});

const updateExchangeRate = asyncHandler(async (req, res) => {
    const rate = await ExchangeRate.findById(req.params.id);

    if (!rate) {
        res.status(404);
        throw new Error('Exchange rate not found');
    }

    // Update allowed fields
    if (req.body.wasteType !== undefined) {
        const wasteType = req.body.wasteType.trim();

        if (!wasteType) {
            res.status(400);
            throw new Error('wasteType is required');
        }

        const existingRate = await ExchangeRate.findOne({
            wasteType,
            _id: { $ne: req.params.id }
        });

        if (existingRate) {
            res.status(409);
            throw new Error(`Exchange rate for "${wasteType}" already exists`);
        }

        rate.wasteType = wasteType;
    }

    const itemRate = req.body.ratePerItem ?? req.body.ratePerKg;

    if (itemRate !== undefined) {
        if (typeof itemRate !== 'number' || itemRate < 0) {
            res.status(400);
            throw new Error('ratePerItem must be a non-negative number');
        }
        rate.ratePerItem = itemRate;
        rate.ratePerKg = undefined;
    }

    if (req.body.description !== undefined) rate.description = req.body.description;
    if (req.body.isActive !== undefined) rate.isActive = req.body.isActive;

    const updatedRate = await rate.save();

    res.json({
        message: 'Exchange rate updated successfully',
        rate: updatedRate
    });
});

const deleteExchangeRate = asyncHandler(async (req, res) => {
    const rate = await ExchangeRate.findByIdAndDelete(req.params.id);

    if (!rate) {
        res.status(404);
        throw new Error('Exchange rate not found');
    }

    res.json({
        message: 'Exchange rate deleted',
        rate
    });
});

const bulkImportExchangeRates = asyncHandler(async (req, res) => {
    const { rates } = req.body;

    if (!Array.isArray(rates)) {
        res.status(400);
        throw new Error('rates must be an array');
    }

    const results = [];

    for (const rateData of rates) {
        const { wasteType, ratePerItem, ratePerKg, description } = rateData;
        const itemRate = ratePerItem ?? ratePerKg;

        if (!wasteType || itemRate === undefined) {
            results.push({
                wasteType: wasteType || 'unknown',
                status: 'error',
                message: 'wasteType and ratePerItem required'
            });
            continue;
        }

        if (typeof itemRate !== 'number' || itemRate < 0) {
            results.push({
                wasteType,
                status: 'error',
                message: 'ratePerItem must be a non-negative number'
            });
            continue;
        }

        try {
            let rate = await ExchangeRate.findOne({
                wasteType: wasteType.trim()
            });

            if (rate) {
                // Update existing
                rate.ratePerItem = itemRate;
                rate.ratePerKg = undefined;
                if (description) rate.description = description;
                rate.isActive = true;
                await rate.save();

                results.push({
                    wasteType,
                    status: 'updated',
                    rate
                });
            } else {
                // Create new
                rate = await ExchangeRate.create({
                    wasteType: wasteType.trim(),
                    ratePerItem: itemRate,
                    description: description || '',
                    isActive: true
                });

                results.push({
                    wasteType,
                    status: 'created',
                    rate
                });
            }
        } catch (err) {
            results.push({
                wasteType,
                status: 'error',
                message: err.message
            });
        }
    }

    res.status(201).json({
        message: 'Bulk import completed',
        results
    });
});

module.exports = {
    getExchangeRates,
    getExchangeRateById,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    bulkImportExchangeRates
};