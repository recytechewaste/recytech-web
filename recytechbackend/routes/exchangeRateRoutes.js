const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all exchange rates
// @route   GET /api/exchange-rates
// @access  Admin only
router.get('/', protect, admin, async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single exchange rate
// @route   GET /api/exchange-rates/:id
// @access  Admin only
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const rate = await ExchangeRate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ message: 'Exchange rate not found' });
        }

        res.json(rate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new exchange rate
// @route   POST /api/exchange-rates
// @access  Admin only
router.post('/', protect, admin, async (req, res) => {
    const { wasteType, ratePerKg, description, isActive } = req.body;

    // Validation
    if (!wasteType || !ratePerKg) {
        return res.status(400).json({
            message: 'wasteType and ratePerKg are required'
        });
    }

    if (typeof ratePerKg !== 'number' || ratePerKg < 0) {
        return res.status(400).json({
            message: 'ratePerKg must be a non-negative number'
        });
    }

    try {
        // Check if waste type already exists
        const existingRate = await ExchangeRate.findOne({
            wasteType: wasteType.trim()
        });

        if (existingRate) {
            return res.status(409).json({
                message: `Exchange rate for "${wasteType}" already exists`
            });
        }

        const newRate = await ExchangeRate.create({
            wasteType: wasteType.trim(),
            ratePerKg,
            description: description || '',
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            message: 'Exchange rate created successfully',
            rate: newRate
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update exchange rate
// @route   PUT /api/exchange-rates/:id
// @access  Admin only
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const rate = await ExchangeRate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ message: 'Exchange rate not found' });
        }

        // Update allowed fields
        if (req.body.ratePerKg !== undefined) {
            if (typeof req.body.ratePerKg !== 'number' || req.body.ratePerKg < 0) {
                return res.status(400).json({
                    message: 'ratePerKg must be a non-negative number'
                });
            }
            rate.ratePerKg = req.body.ratePerKg;
        }

        if (req.body.description !== undefined) {
            rate.description = req.body.description;
        }

        if (req.body.isActive !== undefined) {
            rate.isActive = req.body.isActive;
        }

        const updatedRate = await rate.save();

        res.json({
            message: 'Exchange rate updated successfully',
            rate: updatedRate
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete exchange rate (soft delete - deactivate)
// @route   DELETE /api/exchange-rates/:id
// @access  Admin only
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const rate = await ExchangeRate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ message: 'Exchange rate not found' });
        }

        // Soft delete: mark as inactive
        rate.isActive = false;
        await rate.save();

        res.json({
            message: 'Exchange rate deactivated',
            rate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Bulk create/update exchange rates
// @route   POST /api/exchange-rates/bulk
// @access  Admin only
router.post('/bulk/import', protect, admin, async (req, res) => {
    const { rates } = req.body;

    if (!Array.isArray(rates)) {
        return res.status(400).json({
            message: 'rates must be an array'
        });
    }

    try {
        const results = [];

        for (const rateData of rates) {
            const { wasteType, ratePerKg, description } = rateData;

            if (!wasteType || ratePerKg === undefined) {
                results.push({
                    wasteType: wasteType || 'unknown',
                    status: 'error',
                    message: 'wasteType and ratePerKg required'
                });
                continue;
            }

            try {
                let rate = await ExchangeRate.findOne({
                    wasteType: wasteType.trim()
                });

                if (rate) {
                    // Update existing
                    rate.ratePerKg = ratePerKg;
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
                        ratePerKg,
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
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
