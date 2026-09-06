const RecyclingCenter = require('../models/RecyclingCenter');
const { asyncHandler } = require('../utils/asyncHandler');
const QRCode = require('qrcode');

const generateQrImage = async (qrCode) => {
    if (!qrCode) return null;
    return QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
    });
};

const getCenters = asyncHandler(async (req, res) => {
    const centers = await RecyclingCenter.find()
        .sort({ createdAt: -1 })
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');
    res.json(centers);
});

const getCenterByQrCode = asyncHandler(async (req, res) => {
    const center = await RecyclingCenter.findOne({ qrCode: req.params.qrCode })
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');

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

    const center = await RecyclingCenter.findOne({ qrCode })
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');

    if (!center) {
        res.status(404);
        throw new Error('Bin not found');
    }

    res.json(center);
});

const ensureGeoJsonLocation = (loc) => {
    if (!loc || !Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) return loc;
    const [c0, c1] = loc.coordinates.map(Number);
    // If c0 is latitude (approx -90 to 90) and c1 is longitude (approx >90 or <-90), swap for GeoJSON [lng, lat]
    if (Math.abs(c0) <= 90 && Math.abs(c1) > 90) {
        return {
            type: 'Point',
            coordinates: [c1, c0]
        };
    }
    return {
        type: 'Point',
        coordinates: [c0, c1]
    };
};

const createCenter = asyncHandler(async (req, res) => {
    const { name, location, address, qrCode, capacityKg, currentFillKg, status, description, assignedCollector, assignedLgu } = req.body;
    
    const formattedLocation = ensureGeoJsonLocation(location);
    const qrCodeImage = await generateQrImage(qrCode);

    const center = await RecyclingCenter.create({
        name,
        location: formattedLocation,
        address,
        qrCode,
        qrCodeImage,
        capacityKg,
        currentFillKg,
        status,
        description,
        assignedCollector,
        assignedLgu
    });

    const populatedCenter = await RecyclingCenter.findById(center._id)
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');
    
    res.status(201).json(populatedCenter);
});

const updateCenter = asyncHandler(async (req, res) => {
    const { name, location, address, qrCode, capacityKg, currentFillKg, status, description, assignedCollector, assignedLgu } = req.body;

    const formattedLocation = ensureGeoJsonLocation(location);
    const qrCodeImage = await generateQrImage(qrCode);

    const updatedCenter = await RecyclingCenter.findByIdAndUpdate(
        req.params.id,
        { name, location: formattedLocation, address, qrCode, qrCodeImage, capacityKg, currentFillKg, status, description, assignedCollector, assignedLgu },
        { new: true }
    ).populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
     .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');
    
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