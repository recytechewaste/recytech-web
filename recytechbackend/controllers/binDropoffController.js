const BinDropoff = require('../models/BinDropoff');
const RecyclingCenter = require('../models/RecyclingCenter');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../utils/asyncHandler');
const { calculatePointsAwarded } = require('../utils/calculatePoints');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');
const mongoose = require('mongoose');

// Helper to resolve bin by ObjectId, qrCode, or name
const resolveBinFromInput = async (binId, qrCode) => {
    if (binId) {
        if (mongoose.Types.ObjectId.isValid(binId)) {
            const matched = await RecyclingCenter.findById(binId);
            if (matched) return { resolvedBinId: matched._id, matchedBin: matched };
        }
        const matchedByNameOrCode = await RecyclingCenter.findOne({
            $or: [{ qrCode: binId.toString().trim() }, { name: binId.toString().trim() }]
        });
        if (matchedByNameOrCode) return { resolvedBinId: matchedByNameOrCode._id, matchedBin: matchedByNameOrCode };
    }

    if (!qrCode) {
        return { resolvedBinId: null, matchedBin: null };
    }

    const normalizedQrCode = qrCode.trim();
    const matchedBin = await RecyclingCenter.findOne({ qrCode: normalizedQrCode });

    if (!matchedBin) {
        return { resolvedBinId: null, matchedBin: null };
    }

    return { resolvedBinId: matchedBin._id, matchedBin };
};

// @desc    Create a new dropoff submission (Authenticated Resident)
// @route   POST /api/bin-dropoffs
// @access  Private (Household, Resident, All authenticated)
const createDropoff = asyncHandler(async (req, res) => {
    const { binId, qrCode, wasteType, kilograms, quantity, image, notes, participantEmail, participantName } = req.body;

    if (!wasteType) {
        res.status(400);
        throw new Error('wasteType (e-waste category) is required');
    }

    const count = Number(quantity || kilograms || 1);

    const { resolvedBinId, matchedBin } = await resolveBinFromInput(binId, qrCode);

    if (!resolvedBinId) {
        res.status(400);
        throw new Error('A valid binId or qrCode is required');
    }

    // Resolve authenticated resident profile if available
    let residentId = null;
    let email = participantEmail || req.user?.email || '';
    let name = participantName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : '');

    if (req.user) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (profileId) {
            residentId = profileId;
        } else if (req.user.email) {
            const matchedResident = await Resident.findOne({ email: req.user.email.toLowerCase() });
            if (matchedResident) residentId = matchedResident._id;
        }
    } else if (email) {
        const matchedResident = await Resident.findOne({ email: email.toLowerCase() });
        if (matchedResident) residentId = matchedResident._id;
    }

    // Calculate projected reward points for transparency
    const incentiveResult = await calculatePointsAwarded(wasteType, count);
    const projectedPoints = incentiveResult.success ? incentiveResult.points : 0;

    const dropoff = await BinDropoff.create({
        resident: residentId || undefined,
        binId: resolvedBinId,
        participantEmail: email,
        participantName: name,
        wasteType: wasteType.trim(),
        kilograms: count,
        quantity: count,
        image: image || '',
        notes: notes || '',
        status: 'pending',
        pointsAwarded: 0,
        processed: false
    });

    const populated = await BinDropoff.findById(dropoff._id)
        .populate({
            path: 'binId',
            select: 'name address status location qrCode assignedLgu',
            populate: { path: 'assignedLgu', select: 'name contactPerson email phone' }
        })
        .populate('resident', 'firstName lastName email pointsBalance totalPoints');

    res.status(201).json({
        success: true,
        message: 'Drop-off submission created successfully and is pending validation by the partner organization.',
        projectedPoints,
        dropoff: populated
    });
});

// @desc    Create a public/guest dropoff submission
// @route   POST /api/bin-dropoffs/public
// @access  Public
const createPublicDropoff = asyncHandler(async (req, res) => {
    const { qrCode, binId, participantEmail, participantName, wasteType, kilograms, quantity, image, notes } = req.body;

    if (!wasteType) {
        res.status(400);
        throw new Error('wasteType is required');
    }

    const count = Number(quantity || kilograms || 1);
    const { resolvedBinId, matchedBin } = await resolveBinFromInput(binId, qrCode);

    if (!resolvedBinId) {
        res.status(400);
        throw new Error('A valid bin QR code or binId is required');
    }

    let residentId = null;
    if (participantEmail) {
        const matchedResident = await Resident.findOne({ email: participantEmail.trim().toLowerCase() });
        if (matchedResident) residentId = matchedResident._id;
    }

    const incentiveResult = await calculatePointsAwarded(wasteType, count);
    const projectedPoints = incentiveResult.success ? incentiveResult.points : 0;

    const dropoff = await BinDropoff.create({
        resident: residentId || undefined,
        binId: resolvedBinId,
        participantEmail: participantEmail || '',
        participantName: participantName || '',
        wasteType: wasteType.trim(),
        kilograms: count,
        quantity: count,
        image: image || '',
        notes: notes || '',
        status: 'pending',
        pointsAwarded: 0,
        processed: false
    });

    const populated = await BinDropoff.findById(dropoff._id)
        .populate({
            path: 'binId',
            select: 'name address status location qrCode assignedLgu',
            populate: { path: 'assignedLgu', select: 'name contactPerson email' }
        });

    res.status(201).json({
        success: true,
        message: 'Drop-off recorded successfully and is pending partner organization review.',
        projectedPoints,
        dropoff: populated
    });
});

// @desc    Get all dropoffs (Role-scoped, Paginated, Filterable)
// @route   GET /api/bin-dropoffs
// @access  Private (Admin, Staff, Partner Org, Household)
const getDropoffs = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const { status, search, binId } = req.query;
    const userRole = normalizeRole(req.user.role);

    const query = {};

    // 1. Role-based Scoping
    if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId) {
            return res.json({ dropoffs: [], totalDropoffs: 0, totalPages: 0, currentPage: page });
        }
        // Find all bins assigned to this partner organization
        const assignedBins = await RecyclingCenter.find({ assignedLgu: profileId }).select('_id');
        const assignedBinIds = assignedBins.map(b => b._id);
        query.binId = { $in: assignedBinIds };
    } else if (userRole === CANONICAL_ROLES.HOUSEHOLD) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        query.$or = [
            { resident: profileId },
            { participantEmail: req.user.email.toLowerCase() }
        ];
    }

    // 2. Specific Bin Filter
    if (binId && mongoose.Types.ObjectId.isValid(binId)) {
        query.binId = binId;
    }

    // 3. Status Filter
    if (status && status.trim() !== '') {
        const normalizedStatus = status.trim().toLowerCase();
        query.status = { $regex: new RegExp(`^${normalizedStatus}$`, 'i') };
    }

    const populateBin = {
        path: 'binId',
        select: 'name address status location qrCode capacityKg currentFillKg assignedLgu',
        populate: { path: 'assignedLgu', select: 'name contactPerson email phone jurisdiction' }
    };
    const populateResident = { path: 'resident', select: 'firstName lastName email pointsBalance totalPoints' };
    const populateValidator = { path: 'validatedBy', select: 'name email contactPerson' };

    let dropoffQuery = BinDropoff.find(query)
        .populate(populateBin)
        .populate(populateResident)
        .populate(populateValidator)
        .sort({ createdAt: -1 });

    const allMatching = await dropoffQuery.exec();

    // 4. In-memory search filter
    let filteredResults = allMatching;
    if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        filteredResults = allMatching.filter((item) => {
            const binName = item.binId?.name?.toLowerCase() || '';
            const wasteType = item.wasteType?.toLowerCase() || '';
            const residentName = item.resident
                ? `${item.resident.firstName} ${item.resident.lastName}`.toLowerCase()
                : item.participantName?.toLowerCase() || '';
            const email = item.participantEmail?.toLowerCase() || '';
            const notes = item.notes?.toLowerCase() || '';

            return (
                binName.includes(term) ||
                wasteType.includes(term) ||
                residentName.includes(term) ||
                email.includes(term) ||
                notes.includes(term)
            );
        });
    }

    const totalDropoffs = filteredResults.length;
    const totalPages = Math.ceil(totalDropoffs / limit) || 1;
    const paginatedDropoffs = filteredResults.slice(skip, skip + limit);

    res.json({
        dropoffs: paginatedDropoffs,
        totalDropoffs,
        totalPages,
        currentPage: page
    });
});

// @desc    Get single dropoff by ID
// @route   GET /api/bin-dropoffs/:id
// @access  Private
const getDropoffById = asyncHandler(async (req, res) => {
    const dropoff = await BinDropoff.findById(req.params.id)
        .populate({
            path: 'binId',
            select: 'name address status location qrCode capacityKg currentFillKg assignedLgu',
            populate: { path: 'assignedLgu', select: 'name contactPerson email phone jurisdiction' }
        })
        .populate('resident', 'firstName lastName email pointsBalance totalPoints')
        .populate('validatedBy', 'name email contactPerson');

    if (!dropoff) {
        res.status(404);
        throw new Error('Drop-off record not found');
    }

    res.json(dropoff);
});

// @desc    Validate a dropoff (Approve/Reject by Partner Org or Admin)
// @route   PATCH /api/bin-dropoffs/:id/validate
// @access  Private (Partner Org, Admin, Staff)
const validateDropoff = asyncHandler(async (req, res) => {
    const { action, validationNotes, adjustedPoints } = req.body;
    const { id: dropoffId } = req.params;

    if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
        res.status(400);
        throw new Error('action must be either "approve" or "reject"');
    }

    const dropoff = await BinDropoff.findById(dropoffId).populate('binId');
    if (!dropoff) {
        res.status(404);
        throw new Error('Drop-off record not found');
    }

    if (dropoff.processed || ['approved', 'rejected'].includes(dropoff.status.toLowerCase())) {
        res.status(400);
        throw new Error(`This drop-off has already been validated (${dropoff.status}).`);
    }

    const userRole = normalizeRole(req.user.role);
    let validatorOrgId = null;

    if (userRole === CANONICAL_ROLES.PARTNER_ORG) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        if (!profileId) {
            res.status(403);
            throw new Error('Partner Organization profile not found.');
        }
        validatorOrgId = profileId;

        // Verify that the drop-off's bin is assigned to this partner org
        const binLguId = dropoff.binId?.assignedLgu?.toString();
        if (binLguId && binLguId !== validatorOrgId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You can only validate drop-offs for bins assigned to your organization.');
        }
    } else if (![CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.STAFF, CANONICAL_ROLES.SUPER_ADMIN].includes(userRole)) {
        res.status(403);
        throw new Error('Forbidden: Only Partner Organizations and Admins can validate drop-offs.');
    }

    const isApprove = action.toLowerCase() === 'approve';

    if (isApprove) {
        // Calculate points
        let points = 0;
        if (adjustedPoints !== undefined && Number(adjustedPoints) >= 0) {
            points = Number(adjustedPoints);
        } else {
            const count = dropoff.quantity || dropoff.kilograms || 1;
            const calc = await calculatePointsAwarded(dropoff.wasteType, count);
            points = calc.success ? calc.points : 0;
        }

        dropoff.status = 'approved';
        dropoff.pointsAwarded = points;
        dropoff.validatedBy = validatorOrgId || undefined;
        dropoff.validatedAt = new Date();
        dropoff.validationNotes = validationNotes || 'Approved by partner organization';
        dropoff.processed = true;
        await dropoff.save();

        // If dropoff is linked to a resident, credit points immediately and log transaction
        if (dropoff.resident && points > 0) {
            await Resident.findByIdAndUpdate(dropoff.resident, {
                $inc: { pointsBalance: points, totalPoints: points }
            });

            await Transaction.create({
                resident: dropoff.resident,
                type: 'Payment',
                points: points,
                dropoffId: dropoff._id,
                description: `Reward for verified drop-off (${dropoff.wasteType}) at ${dropoff.binId?.name || 'Recycling Bin'}`
            });
        }

        const populated = await BinDropoff.findById(dropoff._id)
            .populate('binId', 'name address qrCode')
            .populate('resident', 'firstName lastName email pointsBalance totalPoints')
            .populate('validatedBy', 'name email');

        res.json({
            success: true,
            message: `Drop-off approved successfully! Awarded ${points} points.`,
            pointsAwarded: points,
            dropoff: populated
        });

    } else {
        // Reject
        dropoff.status = 'rejected';
        dropoff.pointsAwarded = 0;
        dropoff.validatedBy = validatorOrgId || undefined;
        dropoff.validatedAt = new Date();
        dropoff.validationNotes = validationNotes || 'Rejected by partner organization (e.g., non-compliant e-waste item)';
        dropoff.processed = true;
        await dropoff.save();

        const populated = await BinDropoff.findById(dropoff._id)
            .populate('binId', 'name address qrCode')
            .populate('resident', 'firstName lastName email pointsBalance totalPoints')
            .populate('validatedBy', 'name email');

        res.json({
            success: true,
            message: 'Drop-off submission rejected. No points awarded.',
            dropoff: populated
        });
    }
});

module.exports = {
    createDropoff,
    createPublicDropoff,
    getDropoffs,
    getDropoffById,
    validateDropoff
};

