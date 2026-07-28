const Bin = require('../models/Bin');
const { asyncHandler } = require('../utils/asyncHandler');

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
        res.status(201).json(bin);
    } else {
        res.status(400);
        throw new Error('Invalid bin data');
    }
});

// @desc    Get all bins
// @route   GET /api/bins
// @access  Private
const getAllBins = asyncHandler(async (req, res) => {
    const bins = await Bin.find({}).populate('assignedLgu', 'name');
    res.json(bins);
});

// @desc    Get bin by ID
// @route   GET /api/bins/:id
// @access  Private
const getBinById = asyncHandler(async (req, res) => {
    const bin = await Bin.findById(req.params.id).populate('assignedLgu', 'name');

    if (bin) {
        res.json(bin);
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
