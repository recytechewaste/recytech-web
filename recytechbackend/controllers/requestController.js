const Request = require('../models/Request');
const Bin = require('../models/Bin');
const asyncHandler = require('express-async-handler');
const { completeCollectionAndDistributePoints } = require('../services/pointDistributionService');


// @desc    Get all collection requests
// @route   GET /api/requests
// @access  Private/Admin
const getAllRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find({})
        .populate({ 
            path: 'bin', 
            select: 'name binId address status assignedLgu',
            populate: { path: 'assignedLgu', select: 'name contactPerson email jurisdiction' }
        })
        .populate({ path: 'lgu', select: 'name email contactPerson' })
        .populate({ path: 'assignedCollector', select: 'firstName lastName phone vehiclePlate' })
        .sort({ createdAt: -1 });
    res.json(requests);
});

// @desc    Create a new collection request (for LGUs)
// @route   POST /api/requests
// @access  Private/LGU
const createLguRequest = asyncHandler(async (req, res) => {
    const { binId } = req.body;
    const lguId = req.user._id; // Assuming LGU user is logged in

    const bin = await Bin.findById(binId);
    if (!bin) {
        res.status(404);
        throw new Error('Bin not found');
    }

    // Verify the bin is assigned to the partner organization making the request
    if (bin.assignedLgu.toString() !== lguId.toString()) {
        res.status(403);
        throw new Error('Forbidden: You can only request collection for bins assigned to your partner organization.');
    }

    // Check if there's already a pending/active request for this bin
    const existingRequest = await Request.findOne({
        bin: binId,
        status: { $in: ['Pending', 'Scheduled', 'In-Transit'] }
    });

    if (existingRequest) {
        res.status(400);
        throw new Error('An active collection request for this bin already exists.');
    }

    const request = await Request.create({
        bin: binId,
        lgu: lguId,
    });

    res.status(201).json(request);
});

// @desc    Update a request's status, schedule, and collector (for Admins)
// @route   PUT /api/requests/:id
// @access  Private/Admin
const updateRequestStatus = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }
    const { status, assignedCollector, scheduledDate } = req.body;

    if (status) request.status = status;
    if (assignedCollector) request.assignedCollector = assignedCollector;
    if (scheduledDate) request.scheduledDate = scheduledDate;

    if (request.status === 'Scheduled' && (!request.assignedCollector || !request.scheduledDate)) {
        res.status(400);
        throw new Error('To schedule a request, you must provide both a collector and a scheduled date.');
    }

    const updatedRequest = await request.save();
    res.json(updatedRequest);
});

// @desc    Complete a collection (for Collectors) and distribute points
// @route   PATCH /api/requests/:id/complete
// @access  Private/Collector
const completeRequest = asyncHandler(async (req, res) => {
    const { collectedWaste } = req.body;
    const { id: requestId } = req.params;

    if (!Array.isArray(collectedWaste) || collectedWaste.length === 0) {
        res.status(400);
        throw new Error('Collected waste data must be a non-empty array.');
    }
    
    // Validate that each item in collectedWaste has the required fields
    for (const item of collectedWaste) {
        if (!item.category || !item.quantity || !item.unit) {
            res.status(400);
            throw new Error('Each item in collected waste must have category, quantity, and unit.');
        }
    }

    try {
        const updatedRequest = await completeCollectionAndDistributePoints(requestId, collectedWaste);
        res.json({
            message: 'Collection completed and points distributed successfully.',
            request: updatedRequest
        });
    } catch (error) {
        res.status(500).json({ message: `Failed to complete collection: ${error.message}` });
    }
});

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Private/Admin
const deleteRequest = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (request) {
        if (request.status !== 'Pending' && request.status !== 'Cancelled') {
            res.status(400);
            throw new Error('Only Pending or Cancelled requests can be deleted.');
        }
        await request.remove();
        res.json({ message: 'Request removed' });
    } else {
        res.status(404);
        throw new Error('Request not found');
    }
});


module.exports = {
    getAllRequests,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest,
};