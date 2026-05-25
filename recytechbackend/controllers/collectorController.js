const Collector = require('../models/Collector');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/asyncHandler');

const getCollectors = asyncHandler(async (req, res) => {
    const collectors = await Collector.find();
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
    res.status(201).json(newCollector);
});

const updateCollector = asyncHandler(async (req, res) => {
    const { firstName, lastName, status } = req.body;

    // 1. Update the collector document
    const updatedCollector = await Collector.findByIdAndUpdate(
        req.params.id,
        req.body,
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
        // Remove associated login account
        await User.findByIdAndDelete(collector.user);
        // Remove the collector profile
        await collector.deleteOne();
        res.json({ message: 'Collector removed' });
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