const Collector = require('../models/Collector');
const User = require('../models/User');
const Request = require('../models/Request');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail } = require('../services/emailService');
const { getProfileForUser, normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');

// @desc    Get all collectors (Admin/Staff view)
// @route   GET /api/collectors
// @access  Private/Admin
const getCollectors = asyncHandler(async (req, res) => {
    const collectors = await Collector.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                email: '$userDetails.email'
            }
        }
    ]);
    res.json(collectors);
});

// @desc    Get logged in collector's profile & quick stats
// @route   GET /api/collectors/me
// @access  Private/Collector
const getMyCollectorProfile = asyncHandler(async (req, res) => {
    const { profileId, profile } = await getProfileForUser(req.user._id, req.user.role);

    if (!profileId || !profile) {
        res.status(404);
        throw new Error('Collector profile not found for this user account.');
    }

    // Compute quick metrics for collector home dashboard
    const activeStatuses = [
        'pending', 'Pending',
        'scheduled', 'Scheduled',
        'assigned', 'Assigned',
        'in_progress', 'in-progress', 'In-Progress', 'In Progress',
        'in_transit', 'in-transit', 'In-Transit', 'In Transit',
        'arrived', 'Arrived'
    ];

    const activeJobsCount = await Request.countDocuments({
        assignedCollector: profileId,
        status: { $in: activeStatuses }
    });

    const completedJobsCount = await Request.countDocuments({
        assignedCollector: profileId,
        status: { $in: ['completed', 'Completed'] }
    });

    res.json({
        profile,
        user: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            role: req.user.role,
            status: req.user.status
        },
        stats: {
            activeJobs: activeJobsCount,
            completedJobs: completedJobsCount
        }
    });
});

// @desc    Update collector duty status (Active / Inactive)
// @route   PATCH /api/collectors/status
// @access  Private/Collector
const updateCollectorStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        res.status(400);
        throw new Error('status is required ("Active" or "Inactive")');
    }

    const normalizedStatus = status.trim().toLowerCase() === 'active' ? 'Active' : 'Inactive';

    const { profileId, profile } = await getProfileForUser(req.user._id, req.user.role);
    if (!profileId || !profile) {
        res.status(404);
        throw new Error('Collector profile not found.');
    }

    profile.status = normalizedStatus;
    await profile.save();

    res.json({
        success: true,
        message: `Collector status updated to ${normalizedStatus}.`,
        status: normalizedStatus,
        profile
    });
});

// @desc    Get jobs assigned to logged-in collector
// @route   GET /api/collectors/jobs
// @access  Private/Collector
const getAssignedJobs = asyncHandler(async (req, res) => {
    const { profileId } = await getProfileForUser(req.user._id, req.user.role);

    if (!profileId) {
        res.status(404);
        throw new Error('Collector profile not found.');
    }

    const { status } = req.query;
    const query = { assignedCollector: profileId };

    if (status) {
        const lower = status.trim().toLowerCase();
        if (lower === 'active') {
            query.status = {
                $in: [
                    'pending', 'Pending',
                    'scheduled', 'Scheduled',
                    'assigned', 'Assigned',
                    'in_progress', 'in-progress', 'In-Progress', 'In Progress',
                    'in_transit', 'in-transit', 'In-Transit', 'In Transit',
                    'arrived', 'Arrived'
                ]
            };
        } else if (lower === 'completed') {
            query.status = { $in: ['completed', 'Completed'] };
        } else {
            query.status = { $regex: new RegExp(`^${lower}$`, 'i') };
        }
    }

    const jobs = await Request.find(query)
        .populate({
            path: 'bin',
            select: 'name binId address status location fillLevel currentFillKg capacityKg assignedLgu',
            populate: { path: 'assignedLgu', select: 'name contactPerson phone email jurisdiction' }
        })
        .populate({ path: 'lgu', select: 'name email contactPerson phone address' })
        .sort({ scheduledDate: 1, createdAt: -1 });

    res.json({
        success: true,
        totalJobs: jobs.length,
        jobs
    });
});

// @desc    Get collector performance stats
// @route   GET /api/collectors/stats
// @access  Private/Collector
const getCollectorStats = asyncHandler(async (req, res) => {
    let targetCollectorId = null;

    const userRole = normalizeRole(req.user.role);
    if (userRole === CANONICAL_ROLES.COLLECTOR) {
        const { profileId } = await getProfileForUser(req.user._id, req.user.role);
        targetCollectorId = profileId;
    } else if (req.query.collectorId) {
        targetCollectorId = req.query.collectorId;
    }

    if (!targetCollectorId) {
        res.status(400);
        throw new Error('Collector ID could not be determined.');
    }

    const completedRequests = await Request.find({
        assignedCollector: targetCollectorId,
        status: { $in: ['completed', 'Completed'] }
    });

    let totalItemsCollected = 0;
    const categoryBreakdown = {};

    completedRequests.forEach(reqDoc => {
        if (Array.isArray(reqDoc.collectedWaste)) {
            reqDoc.collectedWaste.forEach(item => {
                const qty = Number(item.quantity || 0);
                totalItemsCollected += qty;
                categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + qty;
            });
        }
    });

    const activeJobsCount = await Request.countDocuments({
        assignedCollector: targetCollectorId,
        status: {
            $in: [
                'pending', 'Pending',
                'scheduled', 'Scheduled',
                'assigned', 'Assigned',
                'in_progress', 'in-progress', 'In-Progress', 'In Progress',
                'in_transit', 'in-transit', 'In-Transit', 'In Transit',
                'arrived', 'Arrived'
            ]
        }
    });

    res.json({
        collectorId: targetCollectorId,
        completedJobs: completedRequests.length,
        activeJobs: activeJobsCount,
        totalItemsCollected,
        categoryBreakdown
    });
});

// @desc    Register a new Collector (Admin only)
// @route   POST /api/collectors
// @access  Private/Admin
const createCollector = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, vehiclePlate, vehicleType, status } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // 2. Create the User account for the collector
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedStatus = (status && status.toLowerCase() === 'inactive') ? 'Inactive' : 'Active';

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'collector',
        status: normalizedStatus
    });

    // 3. Create the Collector profile linked to the User
    const newCollector = await Collector.create({
        user: newUser._id,
        firstName,
        lastName,
        phone,
        vehiclePlate: vehiclePlate || 'Not Assigned',
        vehicleType: vehicleType || 'Not Assigned',
        status: normalizedStatus
    });

    try {
        await sendWelcomeEmail(email, firstName, 'Collector');
    } catch (err) {
        console.error('Failed to send welcome email to collector:', err);
    }

    res.status(201).json(newCollector);
});

// @desc    Update a collector (Admin only)
// @route   PUT /api/collectors/:id
// @access  Private/Admin
const updateCollector = asyncHandler(async (req, res) => {
    const { firstName, lastName, status, phone, vehiclePlate, vehicleType } = req.body;

    const normalizedStatus = status ? (status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : undefined;

    const updatedCollector = await Collector.findByIdAndUpdate(
        req.params.id,
        {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(normalizedStatus && { status: normalizedStatus }),
            ...(phone && { phone }),
            ...(vehiclePlate && { vehiclePlate }),
            ...(vehicleType && { vehicleType })
        },
        { new: true }
    );

    if (updatedCollector) {
        await User.findByIdAndUpdate(updatedCollector.user, {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(normalizedStatus && { status: normalizedStatus })
        });

        res.json(updatedCollector);
    } else {
        res.status(404);
        throw new Error('Collector not found');
    }
});

// @desc    Delete a collector (Admin only)
// @route   DELETE /api/collectors/:id
// @access  Private/Admin
const deleteCollector = asyncHandler(async (req, res) => {
    const collector = await Collector.findById(req.params.id);
    if (collector) {
        await User.findByIdAndUpdate(collector.user, { status: 'Inactive' });
        collector.status = 'Inactive';
        await collector.save();
        res.json({ message: 'Collector disabled successfully. Historical records have been preserved.' });
    } else {
        res.status(404);
        throw new Error('Collector not found');
    }
});

module.exports = {
    getCollectors,
    getMyCollectorProfile,
    updateCollectorStatus,
    getAssignedJobs,
    getCollectorStats,
    createCollector,
    updateCollector,
    deleteCollector
};