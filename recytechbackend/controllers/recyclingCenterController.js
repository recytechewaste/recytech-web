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

const formatBinResponse = (center) => {
    if (!center) return null;
    const obj = center.toObject ? center.toObject() : { ...center };
    if (obj.location && Array.isArray(obj.location.coordinates) && obj.location.coordinates.length === 2) {
        obj.longitude = Number(obj.location.coordinates[0]);
        obj.latitude = Number(obj.location.coordinates[1]);
        obj.lng = Number(obj.location.coordinates[0]);
        obj.lat = Number(obj.location.coordinates[1]);
    }
    obj.binId = obj.binId || obj._id;
    obj.binName = obj.binName || obj.name;
    obj.isAvailableForDropoff = ['Empty', 'Operational', 'Active'].includes(obj.status);
    return obj;
};

/**
 * PUBLIC DTO – explicit allowlist for unauthenticated endpoints.
 * NEVER add description, notes, issueDescription, resolutionNotes, or any
 * internal/admin metadata to this list.
 */
const toPublicDTO = (center) => {
    if (!center) return null;
    const full = formatBinResponse(center);
    return {
        _id:                 full._id,
        binId:               full.binId,
        name:                full.name,
        address:             full.address,
        latitude:            full.latitude,
        longitude:           full.longitude,
        lat:                 full.lat,
        lng:                 full.lng,
        location:            full.location,
        qrCode:              full.qrCode,
        capacityKg:          full.capacityKg,
        currentFillKg:       full.currentFillKg,
        status:              full.status,
        isAvailableForDropoff: full.isAvailableForDropoff,
    };
};

// Authenticated (Staff/Admin) — returns full formatted object including admin fields
const getCenters = asyncHandler(async (req, res) => {
    const centers = await RecyclingCenter.find()
        .sort({ createdAt: -1 })
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');
    res.json(centers.map(formatBinResponse));
});

// Public (no auth) — returns allowlisted fields only; safe for Household/mobile consumers
const getPublicCenters = asyncHandler(async (req, res) => {
    const centers = await RecyclingCenter.find()
        .sort({ createdAt: -1 })
        .lean();
    res.json(centers.map(toPublicDTO));
});

const getCenterByQrCode = asyncHandler(async (req, res) => {
    const center = await RecyclingCenter.findOne({ qrCode: req.params.qrCode })
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');

    if (!center) {
        res.status(404);
        throw new Error('Bin not found');
    }

    res.json(formatBinResponse(center));
});

// Public QR scan — allowlisted fields only; safe for Household/mobile consumers
const getPublicCenterByQrCode = asyncHandler(async (req, res) => {
    const qrCode = req.params.qrCode?.trim();

    if (!qrCode) {
        res.status(400);
        throw new Error('QR code is required');
    }

    const center = await RecyclingCenter.findOne({ qrCode }).lean();

    if (!center) {
        res.status(404);
        throw new Error('Bin not found');
    }

    res.json(toPublicDTO(center));
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
    getPublicCenters,
    getCenterByQrCode,
    getPublicCenterByQrCode,
    createCenter,
    updateCenter,
    deleteCenter
};