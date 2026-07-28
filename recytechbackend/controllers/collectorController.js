const Collector = require('../models/Collector');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendWelcomeEmail } = require('../services/emailService');

const getCollectors = asyncHandler(async (req, res) => {
    const collectors = await Collector.aggregate([
        {
            $lookup: {
                from: 'users', // The collection name for the User model
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

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'Collector',
        status: status || 'Active'
    });

    // 3. Create the Collector profile linked to the User
    const newCollector = await Collector.create({
        user: newUser._id,
        firstName,
        lastName,
        phone,
        vehiclePlate,
        vehicleType,
        status: status || 'Active'
    });

    try {
        await sendWelcomeEmail(email, firstName, 'Collector');
    } catch (err) {
        console.error('Failed to send welcome email to collector:', err);
    }

    res.status(201).json(newCollector);
});

const updateCollector = asyncHandler(async (req, res) => {
    const { firstName, lastName, status, phone, vehiclePlate, vehicleType } = req.body;

    // 1. Update the collector document
    const updatedCollector = await Collector.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, status, phone, vehiclePlate, vehicleType },
        { new: true }
    );

    if (updatedCollector) {
        // 2. Sync with the associated User document
        // Updates firstName, lastName, and status for the login account
        await User.findByIdAndUpdate(updatedCollector.user, {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(status && { status })
        });

        res.json(updatedCollector);
    } else {
        res.status(404);
        throw new Error('Collector not found');
    }
});

const deleteCollector = asyncHandler(async (req, res) => {
    // Find collector to get the associated user ID before deletion
    const collector = await Collector.findById(req.params.id);
    if (collector) {
        // Soft Delete: Mark the login account as inactive so they cannot log in
        await User.findByIdAndUpdate(collector.user, { status: 'Inactive' });
        // Soft Delete: Mark the collector profile as inactive so they don't appear in new assignments
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
    createCollector,
    updateCollector,
    deleteCollector
};