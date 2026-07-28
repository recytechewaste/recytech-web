const RecyclingCenter = require('../models/RecyclingCenter');
const { asyncHandler } = require('../utils/asyncHandler');

const getCenters = asyncHandler(async (req, res) => {
    const centers = await RecyclingCenter.find().sort({ createdAt: -1 }).populate('assignedCollector', 'firstName lastName phone vehiclePlate status');
    res.json(centers);
});

const getCenterByQrCode = asyncHandler(async (req, res) => {
    const center = await RecyclingCenter.findOne({ qrCode: req.params.qrCode }).populate('assignedCollector', 'firstName lastName phone vehiclePlate status');

    if (!center) {
        res.status(404);
        throw new Error('Bin not found');
    }

    res.json(center);
});

const getPublicCenterByQrCode = asyncHandler(async (req, res) => {
    const qrCode = req.params.qrCode?.trim();

    if (!qrCode) {
        res.status(400);
        throw new Error('QR code is required');
    }

    const center = await RecyclingCenter.findOne({ qrCode }).populate('assignedCollector', 'firstName lastName phone vehiclePlate status');

    if (!center) {
        res.status(404);
        throw new Error('Bin not found');
    }

    res.json(center);
});

const createCenter = asyncHandler(async (req, res) => {
    const { name, location, address, qrCode, capacityKg, currentFillKg, status, description, assignedCollector } = req.body;
    
    const center = await RecyclingCenter.create({
        name,
        location,
        address,
        qrCode,
        capacityKg,
        currentFillKg,
        status,
        description,
        assignedCollector
    });
    
    res.status(201).json(center);
});

const updateCenter = asyncHandler(async (req, res) => {
    const { name, location, address, qrCode, capacityKg, currentFillKg, status, description, assignedCollector } = req.body;

    const updatedCenter = await RecyclingCenter.findByIdAndUpdate(
        req.params.id,
        { name, location, address, qrCode, capacityKg, currentFillKg, status, description, assignedCollector },
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

module.exports = {
    getCenters,
    getCenterByQrCode,
    getPublicCenterByQrCode,
    createCenter,
    updateCenter,
    deleteCenter
};