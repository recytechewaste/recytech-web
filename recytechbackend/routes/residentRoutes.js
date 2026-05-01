const express = require('express');
const router = express.Router();
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all residents with wallet balances
// @route   GET /api/residents
// @access  Admin only
router.get('/', protect, admin, async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single resident with transaction history
// @route   GET /api/residents/:id
// @access  Admin only
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);

        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        // Get transaction history
        const transactions = await Transaction.find({ resident: resident._id })
            .populate('requestId', 'wasteType weight status')
            .sort({ createdAt: -1 });

        res.json({
            ...resident.toObject(),
            transactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update resident (status, info)
// @route   PUT /api/residents/:id
// @access  Admin only
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);

        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        // Allow updates to these fields only
        if (req.body.status) resident.status = req.body.status;
        if (req.body.firstName) resident.firstName = req.body.firstName;
        if (req.body.lastName) resident.lastName = req.body.lastName;
        if (req.body.phone) resident.phone = req.body.phone;

        const updatedResident = await resident.save();
        res.json(updatedResident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete resident (mark inactive or hard delete)
// @route   DELETE /api/residents/:id
// @access  Admin only
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);

        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Search residents by email or name
// @route   GET /api/residents/search
// @access  Admin only
router.get('/search/:query', protect, admin, async (req, res) => {
    try {
        const searchQuery = req.params.query;

        const residents = await Resident.find({
            $or: [
                { email: { $regex: searchQuery, $options: 'i' } },
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } }
            ]
        }).limit(20);

        res.json(residents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
