const RewardPoint = require('../models/RewardPoint');
const { asyncHandler } = require('../utils/asyncHandler');

const getRewardPoints = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';

    let query = {};
    if (!includeInactive) {
        query.isActive = true;
    }

    const points = await RewardPoint.find(query).sort({ wasteType: 1 });

    res.json({
        points,
        count: points.length
    });
});

const getRewardPointById = asyncHandler(async (req, res) => {
    const point = await RewardPoint.findById(req.params.id);

    if (!point) {
        res.status(404);
        throw new Error('Reward point rule not found');
    }

    res.json(point);
});

const createRewardPoint = asyncHandler(async (req, res) => {
    const { wasteType, pointsPerItem, description, isActive } = req.body; // Changed pointsPerKg to pointsPerItem

    if (!wasteType || pointsPerItem === undefined) { // Changed pointsPerKg to pointsPerItem
        res.status(400);
        throw new Error('wasteType and pointsPerItem are required'); // Changed pointsPerKg to pointsPerItem
    }

    if (typeof pointsPerItem !== 'number' || pointsPerItem < 0) { // Changed pointsPerKg to pointsPerItem
        res.status(400);
        throw new Error('pointsPerItem must be a non-negative number'); // Changed pointsPerKg to pointsPerItem
    }

    const existingPoint = await RewardPoint.findOne({
        wasteType: wasteType.trim()
    });

    if (existingPoint) {
        res.status(409);
        throw new Error(`Reward point rule for "${wasteType}" already exists`);
    }

    const newPoint = await RewardPoint.create({
        wasteType: wasteType.trim(),
        pointsPerItem, // Changed pointsPerKg to pointsPerItem
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
        message: 'Reward point rule created successfully',
        point: newPoint
    });
});

const updateRewardPoint = asyncHandler(async (req, res) => {
    const point = await RewardPoint.findById(req.params.id);

    if (!point) {
        res.status(404);
        throw new Error('Reward point rule not found');
    }

    if (req.body.wasteType !== undefined) {
        const wasteType = req.body.wasteType.trim();

        if (!wasteType) {
            res.status(400);
            throw new Error('wasteType is required');
        }

        const existingPoint = await RewardPoint.findOne({
            wasteType,
            _id: { $ne: req.params.id }
        });

        if (existingPoint) {
            res.status(409);
            throw new Error(`Reward point rule for "${wasteType}" already exists`);
        }

        point.wasteType = wasteType;
    }

    if (req.body.pointsPerItem !== undefined) { // Changed pointsPerKg to pointsPerItem
        if (typeof req.body.pointsPerItem !== 'number' || req.body.pointsPerItem < 0) { // Changed pointsPerKg to pointsPerItem
            res.status(400);
            throw new Error('pointsPerItem must be a non-negative number'); // Changed pointsPerKg to pointsPerItem
        }
        point.pointsPerItem = req.body.pointsPerItem; // Changed pointsPerKg to pointsPerItem
    }

    if (req.body.description !== undefined) point.description = req.body.description;
    if (req.body.isActive !== undefined) point.isActive = req.body.isActive;

    const updatedPoint = await point.save();

    res.json({
        message: 'Reward point rule updated successfully',
        point: updatedPoint
    });
});

const deleteRewardPoint = asyncHandler(async (req, res) => {
    const point = await RewardPoint.findByIdAndDelete(req.params.id);

    if (!point) {
        res.status(404);
        throw new Error('Reward point rule not found');
    }

    res.json({
        message: 'Reward point rule deleted',
        point
    });
});

const bulkImportRewardPoints = asyncHandler(async (req, res) => {
    const { points } = req.body;

    if (!Array.isArray(points)) {
        res.status(400);
        throw new Error('points must be an array');
    }

    const results = [];

    for (const pointData of points) {
        const { wasteType, pointsPerItem, description } = pointData; // Changed pointsPerKg to pointsPerItem

        if (!wasteType || pointsPerItem === undefined) { // Changed pointsPerKg to pointsPerItem
            results.push({
                wasteType: wasteType || 'unknown',
                status: 'error',
                message: 'wasteType and pointsPerItem required' // Changed pointsPerKg to pointsPerItem
            });
            continue;
        }

        if (typeof pointsPerItem !== 'number' || pointsPerItem < 0) { // Changed pointsPerKg to pointsPerItem
            results.push({
                wasteType,
                status: 'error',
                message: 'pointsPerItem must be a non-negative number' // Changed pointsPerKg to pointsPerItem
            });
            continue;
        }

        try {
            let point = await RewardPoint.findOne({
                wasteType: wasteType.trim()
            });

            if (point) {
                point.pointsPerItem = pointsPerItem; // Changed pointsPerKg to pointsPerItem
                if (description) point.description = description;
                point.isActive = true;
                await point.save();

                results.push({
                    wasteType,
                    status: 'updated',
                    point
                });
            } else {
                point = await RewardPoint.create({
                    wasteType: wasteType.trim(),
                    pointsPerItem, // Changed pointsPerKg to pointsPerItem
                    description: description || '',
                    isActive: true
                });

                results.push({
                    wasteType,
                    status: 'created',
                    point
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
    getRewardPoints,
    getRewardPointById,
    createRewardPoint,
    updateRewardPoint,
    deleteRewardPoint,
    bulkImportRewardPoints
};