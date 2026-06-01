const RecyclingCenter = require('../models/RecyclingCenter');
const { asyncHandler } = require('../utils/asyncHandler');

const getCenters = asyncHandler(async (req, res) => {
    const centers = await RecyclingCenter.find().sort({ createdAt: -1 });
    res.json(centers);
});

const createCenter = asyncHandler(async (req, res) => {
    const { name, location, address, items, status } = req.body;
    
    const center = await RecyclingCenter.create({
        name,
        location,
        address,
        items,
        status
    });
    
    res.status(201).json(center);
});

const updateCenter = asyncHandler(async (req, res) => {
    const { name, location, address, items, status } = req.body;

    const updatedCenter = await RecyclingCenter.findByIdAndUpdate(
        req.params.id,
        { name, location, address, items, status },
        { new: true }
    );
    
    if (updatedCenter) {
        res.json(updatedCenter);
    } else {
        res.status(404);
        throw new Error('Center not found');
    }
});

const deleteCenter = asyncHandler(async (req, res) => {
    const center = await RecyclingCenter.findByIdAndDelete(req.params.id);
    
    if (center) {
        res.json({ message: 'Center removed' });
    } else {
        res.status(404);
        throw new Error('Center not found');
    }
});

module.exports = { getCenters, createCenter, updateCenter, deleteCenter };