const Bin = require('../models/Bin');
const RecyclingCenter = require('../models/RecyclingCenter');
const { asyncHandler } = require('../utils/asyncHandler');

// Helper to normalize bin payload for mobile mapping
const formatBinForClient = (doc) => {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    if (obj.location && Array.isArray(obj.location.coordinates) && obj.location.coordinates.length === 2) {
        obj.longitude = Number(obj.location.coordinates[0]);
        obj.latitude = Number(obj.location.coordinates[1]);
        obj.lng = Number(obj.location.coordinates[0]);
        obj.lat = Number(obj.location.coordinates[1]);
    }
    obj.binId = obj.binId || obj._id;
    obj.binName = obj.binName || obj.name;
    obj.name = obj.name || obj.binName || `Bin ${obj.binId}`;
    obj.isAvailableForDropoff = ['Empty', 'Operational', 'Active'].includes(obj.status);
    return obj;
};

// @desc    Create a new bin
// @route   POST /api/bins
// @access  Private/Admin
const createBin = asyncHandler(async (req, res) => {
    const { binId, location, address, status, fillLevel, assignedLgu } = req.body;

    const bin = await Bin.create({
        binId,
        location,
        address,
        status,
        fillLevel,
        assignedLgu,
    });

    if (bin) {
        res.status(201).json(formatBinForClient(bin));
    } else {
        res.status(400);
        throw new Error('Invalid bin data');
    }
});

// @desc    Get all bins (Harmonized with RecyclingCenter canonical web bins)
// @route   GET /api/bins
// @access  Public / Private
const getAllBins = asyncHandler(async (req, res) => {
    const [recyclingCenters, legacyBins] = await Promise.all([
        RecyclingCenter.find({})
            .sort({ createdAt: -1 })
            .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
            .populate('assignedLgu', 'name contactPerson phone email jurisdiction status'),
        Bin.find({}).populate('assignedLgu', 'name')
    ]);

    const formattedCenters = recyclingCenters.map(formatBinForClient);
    const formattedLegacy = legacyBins.map(formatBinForClient);

    // Prefer web RecyclingCenter bins, fallback/combine with any unique legacy bins
    const seenIds = new Set(formattedCenters.map(b => b.binId?.toString() || b._id?.toString()));
    const combined = [...formattedCenters];
    for (const b of formattedLegacy) {
        const idStr = b.binId?.toString() || b._id?.toString();
        if (!seenIds.has(idStr)) {
            combined.push(b);
        }
    }

    res.json(combined);
});

// @desc    Get bin by ID
// @route   GET /api/bins/:id
// @access  Public / Private
const getBinById = asyncHandler(async (req, res) => {
    let bin = await RecyclingCenter.findById(req.params.id)
        .populate('assignedCollector', 'firstName lastName phone vehiclePlate status')
        .populate('assignedLgu', 'name contactPerson phone email jurisdiction status');

    if (!bin) {
        bin = await Bin.findById(req.params.id).populate('assignedLgu', 'name');
    }

    if (!bin) {
        bin = await RecyclingCenter.findOne({ qrCode: req.params.id }) || await Bin.findOne({ binId: req.params.id });
    }

    if (bin) {
        res.json(formatBinForClient(bin));
    } else {
        res.status(404);
        throw new Error('Bin not found');
    }
});

// @desc    Update bin
// @route   PUT /api/bins/:id
// @access  Private/Admin
const updateBin = asyncHandler(async (req, res) => {
    const bin = await Bin.findById(req.params.id);

    if (bin) {
        bin.binId = req.body.binId || bin.binId;
        bin.location = req.body.location || bin.location;
        bin.address = req.body.address || bin.address;
        bin.status = req.body.status || bin.status;
        bin.fillLevel = req.body.fillLevel || bin.fillLevel;
        bin.assignedLgu = req.body.assignedLgu || bin.assignedLgu;

        const updatedBin = await bin.save();
        res.json(updatedBin);
    } else {
        res.status(404);
        throw new Error('Bin not found');
    }
});

// @desc    Delete bin
// @route   DELETE /api/bins/:id
// @access  Private/Admin
const deleteBin = asyncHandler(async (req, res) => {
    const bin = await Bin.findById(req.params.id);

    if (bin) {
        // Soft-delete by setting status to 'Maintenance' or 'Inactive'
        bin.status = 'Archived'; // Using 'Archived' to denote it's out of service
        await bin.save();
        res.json({ message: 'Bin has been archived and removed from service.' });
    } else {
        res.status(404);
        throw new Error('Bin not found');
    }
});

module.exports = {
    createBin,
    getAllBins,
    getBinById,
    updateBin,
    deleteBin,
};
