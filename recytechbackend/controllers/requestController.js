const Request = require('../models/Request');
const Bin = require('../models/Bin');
const RecyclingCenter = require('../models/RecyclingCenter');
const asyncHandler = require('express-async-handler');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');

// @desc    Get all collection requests (Role-scoped, Paginated, Filterable)
// @route   GET /api/requests
// @access  Private (Admin, Staff, Partner Org, Collector)
const getAllRequests = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const { search, status, type } = req.query;
    const userRole = normalizeRole(req.user.role);

    const query = {};

    // 1. Role-based scoping
    if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId) {
            return res.json({ requests: [], totalRequests: 0, totalPages: 0, currentPage: page });
        }
        query.lgu = profileId;
    } else if (userRole === CANONICAL_ROLES.COLLECTOR) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId) {
            return res.json({ requests: [], totalRequests: 0, totalPages: 0, currentPage: page });
        }
        query.assignedCollector = profileId;
    }

    // 2. Status filter
    if (status && status.trim() !== '') {
        const normalizedStatus = status.trim().toLowerCase();
        query.status = { $regex: new RegExp(`^${normalizedStatus}$`, 'i') };
    }

    // 3. Request type filter
    if (type && type.trim() !== '') {
        query.requestType = { $regex: new RegExp(`^${type.trim()}$`, 'i') };
    }

    // 4. Populate options
    const populateBin = {
        path: 'bin',
        select: 'name binId binCode qrCode address status location assignedLgu fillLevel capacityKg currentFillKg',
        populate: { path: 'assignedLgu', select: 'name contactPerson email phone jurisdiction' }
    };
    const populateLgu = { path: 'lgu', select: 'name email contactPerson phone address organizationType' };
    const populateCollector = { path: 'assignedCollector', select: 'firstName lastName phone vehiclePlate vehicleType status' };

    // 5. Fetch documents
    let requestQuery = Request.find(query)
        .populate(populateBin)
        .populate(populateLgu)
        .populate(populateCollector)
        .sort({ createdAt: -1 });

    const allMatching = await requestQuery.exec();

    // 6. In-memory search filter if search term provided
    let filteredResults = allMatching;
    if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        filteredResults = allMatching.filter((item) => {
            const binName = item.bin?.name?.toLowerCase() || '';
            const binCode = item.bin?.binId?.toLowerCase() || '';
            const binAddr = item.bin?.address?.toLowerCase() || '';
            const lguName = item.lgu?.name?.toLowerCase() || '';
            const collectorName = item.assignedCollector
                ? `${item.assignedCollector.firstName} ${item.assignedCollector.lastName}`.toLowerCase()
                : '';
            const notes = item.notes?.toLowerCase() || '';

            return (
                binName.includes(term) ||
                binCode.includes(term) ||
                binAddr.includes(term) ||
                lguName.includes(term) ||
                collectorName.includes(term) ||
                notes.includes(term)
            );
        });
    }

    const totalRequests = filteredResults.length;
    const totalPages = Math.ceil(totalRequests / limit) || 1;
    const paginatedRequests = filteredResults.slice(skip, skip + limit);

    res.json({
        requests: paginatedRequests,
        totalRequests,
        totalPages,
        currentPage: page
    });
});

// @desc    Get single collection request by ID
// @route   GET /api/requests/:id
// @access  Private (Admin, Staff, Assigned Partner Org, Assigned Collector)
const getRequestById = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id)
        .populate({
            path: 'bin',
            select: 'name binId binCode qrCode address status location assignedLgu fillLevel capacityKg currentFillKg',
            populate: { path: 'assignedLgu', select: 'name contactPerson email phone jurisdiction' }
        })
        .populate({ path: 'lgu', select: 'name email contactPerson phone address organizationType' })
        .populate({ path: 'assignedCollector', select: 'firstName lastName phone vehiclePlate vehicleType status' });

    if (!request) {
        res.status(404);
        throw new Error('Collection request not found');
    }

    const userRole = normalizeRole(req.user.role);

    // Verify access
    if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId || request.lgu?._id?.toString() !== profileId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only view requests belonging to your organization.');
        }
    } else if (userRole === CANONICAL_ROLES.COLLECTOR) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId || request.assignedCollector?._id?.toString() !== profileId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only view requests assigned to you.');
        }
    }

    res.json(request);
});

// @desc    Create a new collection request (Partner Organizations & Admins)
// @route   POST /api/requests
// @access  Private/Partner Org / Admin
const createLguRequest = asyncHandler(async (req, res) => {
    const { binId, notes, requestType } = req.body;

    if (!binId) {
        res.status(400);
        throw new Error('A bin ID is required to create a collection request.');
    }

    // Resolve bin (either from Bin or RecyclingCenter by ObjectId, code, qrCode, or name)
    let bin = null;
    let binModel = 'Bin';

    if (require('mongoose').Types.ObjectId.isValid(binId)) {
        bin = await Bin.findById(binId);
        if (bin) binModel = 'Bin';
    }
    if (!bin) {
        bin = await Bin.findOne({
            $or: [{ binId: binId.toString() }, { binCode: binId.toString() }]
        });
        if (bin) binModel = 'Bin';
    }
    if (!bin && require('mongoose').Types.ObjectId.isValid(binId)) {
        bin = await RecyclingCenter.findById(binId);
        if (bin) binModel = 'RecyclingCenter';
    }
    if (!bin) {
        bin = await RecyclingCenter.findOne({
            $or: [{ qrCode: binId.toString() }, { name: binId.toString() }]
        });
        if (bin) binModel = 'RecyclingCenter';
    }

    if (!bin) {
        res.status(404);
        throw new Error('Bin not found');
    }

    const userRole = normalizeRole(req.user.role);
    let lguId = null;

    if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId) {
            res.status(404);
            throw new Error('Partner Organization profile not found for this user.');
        }
        lguId = profileId;

        // Verify bin is assigned to this partner organization
        if (bin.assignedLgu && bin.assignedLgu.toString() !== lguId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only request collection for bins assigned to your partner organization.');
        }
    } else if ([CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.STAFF, CANONICAL_ROLES.SUPER_ADMIN].includes(userRole)) {
        lguId = req.body.lgu || bin.assignedLgu;
        if (!lguId) {
            res.status(400);
            throw new Error('Partner Organization ID (lgu) is required when creating request as Admin.');
        }
    } else {
        res.status(403);
        throw new Error('Forbidden: Only Partner Organizations and Admins can create collection requests.');
    }

    // Check if there's already an active request for this bin
    const activeStatuses = [
        'pending', 'Pending',
        'scheduled', 'Scheduled',
        'approved', 'Approved',
        'assigned', 'Assigned',
        'in_progress', 'in-progress', 'In-Progress', 'In Progress',
        'in_transit', 'in-transit', 'In-Transit', 'In Transit',
        'arrived', 'Arrived'
    ];

    const existingRequest = await Request.findOne({
        bin: bin._id,
        status: { $in: activeStatuses }
    });

    if (existingRequest) {
        res.status(400);
        throw new Error('An active collection request for this bin already exists.');
    }

    const request = await Request.create({
        bin: bin._id,
        binModel: binModel || 'Bin',
        lgu: lguId,
        requestType: requestType || 'manual',
        status: 'pending',
        notes: notes || ''
    });

    const populatedRequest = await Request.findById(request._id)
        .populate({ path: 'bin', select: 'name binId binCode qrCode address status location assignedLgu fillLevel capacityKg currentFillKg' })
        .populate({ path: 'lgu', select: 'name email contactPerson phone address organizationType' });

    res.status(201).json(populatedRequest);
});

// @desc    Update a request's status, schedule, or assigned collector
// @route   PUT /api/requests/:id
// @access  Private (Admin, Staff, Assigned Collector)
const updateRequestStatus = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    const userRole = normalizeRole(req.user.role);
    const { status, assignedCollector, scheduledDate, notes } = req.body;

    if (userRole === CANONICAL_ROLES.COLLECTOR) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId || request.assignedCollector?.toString() !== profileId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only update requests assigned to you.');
        }

        // Collector can update status to in_progress, in_transit, arrived, cancelled
        if (status) request.status = status.toLowerCase();
        if (notes) request.notes = notes;
    } else if ([CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.STAFF, CANONICAL_ROLES.SUPER_ADMIN].includes(userRole)) {
        if (status) request.status = status.toLowerCase();
        if (assignedCollector !== undefined) request.assignedCollector = assignedCollector || null;
        if (scheduledDate !== undefined) request.scheduledDate = scheduledDate;
        if (notes !== undefined) request.notes = notes;

        if (request.status === 'scheduled' && (!request.assignedCollector || !request.scheduledDate)) {
            res.status(400);
            throw new Error('To schedule a request, you must provide both an assigned collector and a scheduled date.');
        }
    } else {
        res.status(403);
        throw new Error('Not authorized to update collection requests.');
    }

    const updatedRequest = await request.save();

    const populated = await Request.findById(updatedRequest._id)
        .populate({ path: 'bin', select: 'name binId binCode qrCode address status location assignedLgu fillLevel capacityKg currentFillKg' })
        .populate({ path: 'lgu', select: 'name email contactPerson phone' })
        .populate({ path: 'assignedCollector', select: 'firstName lastName phone vehiclePlate vehicleType' });

    res.json(populated);
});

// @desc    Complete a collection request (for Collectors and Admins)
// @route   PATCH /api/requests/:id/complete
// @access  Private (Collector, Admin, Staff)
const completeRequest = asyncHandler(async (req, res) => {
    const { collectedWaste, notes } = req.body;
    const { id: requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    const userRole = normalizeRole(req.user.role);

    if (userRole === CANONICAL_ROLES.COLLECTOR) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId || request.assignedCollector?.toString() !== profileId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only complete requests assigned to you.');
        }
    }

    if (['completed', 'Completed'].includes(request.status)) {
        res.status(400);
        throw new Error('This collection request has already been completed.');
    }

    if (Array.isArray(collectedWaste) && collectedWaste.length > 0) {
        for (const item of collectedWaste) {
            if (!item.category || item.quantity === undefined || !item.unit) {
                res.status(400);
                throw new Error('Each item in collected waste must have category, quantity, and unit.');
            }
        }
        request.collectedWaste = collectedWaste;
    }

    request.status = 'completed';
    request.completionDate = new Date();
    if (notes) request.notes = notes;

    const saved = await request.save();

    // Reset the bin fill level and status so it is ready for new drop-offs
    if (request.bin) {
        const RecyclingCenter = require('../models/RecyclingCenter');
        await RecyclingCenter.findByIdAndUpdate(request.bin, {
            status: 'Empty',
            currentFillKg: 0
        });
        const Bin = require('../models/Bin');
        await Bin.findByIdAndUpdate(request.bin, {
            status: 'Operational',
            fillLevel: 0
        });
    }

    const populated = await Request.findById(saved._id)
        .populate({ path: 'bin', select: 'name binId binCode qrCode address status location assignedLgu fillLevel capacityKg currentFillKg' })
        .populate({ path: 'lgu', select: 'name email contactPerson' })
        .populate({ path: 'assignedCollector', select: 'firstName lastName phone vehiclePlate vehicleType' });

    res.json({
        message: 'Collection request completed successfully.',
        request: populated
    });
});

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Private/Admin
const deleteRequest = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (request) {
        const normalizedStatus = request.status.toLowerCase();
        if (normalizedStatus !== 'pending' && normalizedStatus !== 'cancelled') {
            res.status(400);
            throw new Error('Only Pending or Cancelled requests can be deleted.');
        }
        await request.deleteOne();
        res.json({ message: 'Request removed successfully' });
    } else {
        res.status(404);
        throw new Error('Request not found');
    }
});

module.exports = {
    getAllRequests,
    getRequestById,
    createLguRequest,
    updateRequestStatus,
    completeRequest,
    deleteRequest
};