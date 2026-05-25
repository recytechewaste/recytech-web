const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../utils/asyncHandler');

const getResidents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const residents = await Resident.find()
        .skip(skip)
        .limit(limit)
        .sort({ totalEarned: -1 });

    const total = await Resident.countDocuments();

    res.json({
        residents,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const createTempResident = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, mobileUserId, status, source, isTemporary } = req.body || {};

    if (!firstName || !lastName) {
        res.status(400);
        throw new Error('firstName and lastName are required');
    }

    const generatedEmail = email
        ? email.trim().toLowerCase()
        : `temp-${String(phone || `${firstName}-${lastName}-${Date.now()}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}@recytech.local`;

    let resident = await Resident.findOne({ email: generatedEmail });
    let resultStatus = 'existing';

    if (!resident) {
        resident = await Resident.create({
            email: generatedEmail,
            firstName,
            lastName,
            phone,
            mobileUserId,
            status: status || 'Active',
            source: source || 'Mobile Simulation',
            isTemporary: isTemporary !== undefined ? isTemporary : true
        });
        resultStatus = 'created';
    } else {
        resident.firstName = firstName;
        resident.lastName = lastName;
        if (phone !== undefined) resident.phone = phone;
        if (mobileUserId !== undefined) resident.mobileUserId = mobileUserId;
        if (status !== undefined) resident.status = status;
        resident.source = source || resident.source || 'Mobile Simulation';
        resident.isTemporary = isTemporary !== undefined ? isTemporary : true;
        await resident.save();
        resultStatus = 'updated';
    }

    res.status(resultStatus === 'created' ? 201 : 200).json({
        message: `Temporary resident ${resultStatus}`,
        resident
    });
});

const getResidentById = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
        res.status(404);
        throw new Error('Resident not found');
    }

    // Get transaction history
    const transactions = await Transaction.find({ resident: resident._id })
        .populate('requestId', 'wasteType quantity status')
        .sort({ createdAt: -1 });

    res.json({
        ...resident.toObject(),
        transactions
    });
});

const updateResident = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
        res.status(404);
        throw new Error('Resident not found');
    }

    // Allow updates to these fields only
    if (req.body.email !== undefined) {
        const email = req.body.email.trim().toLowerCase();

        if (!email) {
            res.status(400);
            throw new Error('Email is required');
        }

        const existingResident = await Resident.findOne({
            email,
            _id: { $ne: req.params.id }
        });

        if (existingResident) {
            res.status(409);
            throw new Error('Resident email already exists');
        }

        resident.email = email;
    }

    if (req.body.status) resident.status = req.body.status;
    if (req.body.firstName) resident.firstName = req.body.firstName;
    if (req.body.lastName) resident.lastName = req.body.lastName;
    if (req.body.phone) resident.phone = req.body.phone;
    if (req.body.mobileUserId !== undefined) resident.mobileUserId = req.body.mobileUserId;
    if (req.body.isTemporary !== undefined) resident.isTemporary = req.body.isTemporary;
    if (req.body.source) resident.source = req.body.source;
    if (req.body.walletBalance !== undefined) resident.walletBalance = req.body.walletBalance;

    const updatedResident = await resident.save();
    res.json(updatedResident);
});

const deleteResident = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
        res.status(404);
        throw new Error('Resident not found');
    }

    // Option: Mark as inactive (soft delete)
    const hardDelete = req.query.hardDelete === 'true';

    if (hardDelete) {
        // Hard delete: remove resident and all transactions
        await Transaction.deleteMany({ resident: resident._id });
        await Resident.findByIdAndDelete(req.params.id);
        res.json({ message: 'Resident and transactions permanently deleted' });
    } else {
        // Soft delete: just mark as inactive
        resident.status = 'Inactive';
        await resident.save();
        res.json({ message: 'Resident marked as inactive', resident });
    }
});

const searchResidents = asyncHandler(async (req, res) => {
    const searchQuery = req.params.query;

    const residents = await Resident.find({
        $or: [
            { email: { $regex: searchQuery, $options: 'i' } },
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } }
        ]
    }).limit(20);

    res.json(residents);
});

module.exports = {
    getResidents,
    createTempResident,
    getResidentById,
    updateResident,
    deleteResident,
    searchResidents
};