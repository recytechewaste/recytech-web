const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail } = require('../services/emailService');

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

const createResident = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, mobileUserId, status, source, isTemporary } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields: First Name, Last Name, Email, and Password.');
    }

    const generatedEmail = email.trim().toLowerCase();

    const existingResident = await Resident.findOne({ email: generatedEmail });

    if (existingResident) {
        res.status(409);
        throw new Error('A resident with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const resident = await Resident.create({
        email: generatedEmail,
        firstName,
        lastName,
        password: hashedPassword,
        phone: phone || '',
        mobileUserId,
        status: status || 'Active',
        source: source || 'Web',
        isTemporary: isTemporary !== undefined ? isTemporary : false
    });
    
    const residentResponse = resident.toObject();
    delete residentResponse.password; // Ensure password is removed from API response

    try {
        await sendWelcomeEmail(generatedEmail, firstName, 'Mobile User');
    } catch (err) {
        console.error('Failed to send welcome email to resident:', err);
    }

    res.status(201).json({
        message: 'Resident created successfully',
        resident: residentResponse
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


    if (req.body.status) resident.status = req.body.status;
    if (req.body.firstName !== undefined) resident.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) resident.lastName = req.body.lastName;
    if (req.body.phone !== undefined) resident.phone = req.body.phone;
    if (req.body.mobileUserId !== undefined) resident.mobileUserId = req.body.mobileUserId;
    if (req.body.isTemporary !== undefined) resident.isTemporary = req.body.isTemporary;
    if (req.body.source) resident.source = req.body.source;

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
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const residents = await Resident.find({
        $or: [
            { email: { $regex: escapedQuery, $options: 'i' } },
            { firstName: { $regex: escapedQuery, $options: 'i' } },
            { lastName: { $regex: escapedQuery, $options: 'i' } }
        ]
    }).limit(20);

    res.json(residents);
});

module.exports = {
    getResidents,
    createResident,
    getResidentById,
    updateResident,
    deleteResident,
    searchResidents
};