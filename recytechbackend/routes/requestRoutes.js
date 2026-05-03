const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const ExchangeRate = require('../models/ExchangeRate');
const { calculatePayoutAmount } = require('../utils/calculatePayout');
const { protect, admin } = require('../middleware/authMiddleware');

const splitResidentName = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    return {
        firstName: parts[0] || 'Temporary',
        lastName: parts.slice(1).join(' ') || 'Resident'
    };
};

const buildTemporaryEmail = ({ residentEmail, phone, residentName }) => {
    if (residentEmail) return residentEmail.trim().toLowerCase();

    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (phoneDigits) return `temp-${phoneDigits}@recytech.local`;

    const nameSlug = String(residentName || 'resident')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'resident';

    return `temp-${nameSlug}-${Date.now()}@recytech.local`;
};

const findOrCreateTemporaryResident = async ({ residentName, residentEmail, phone, firstName, lastName, mobileUserId }) => {
    const email = buildTemporaryEmail({ residentEmail, phone, residentName });
    const parsedName = splitResidentName(residentName);

    let resident = await Resident.findOne({ email });

    if (!resident) {
        resident = await Resident.create({
            email,
            firstName: firstName || parsedName.firstName,
            lastName: lastName || parsedName.lastName,
            phone,
            mobileUserId,
            source: 'Mobile Simulation',
            isTemporary: true
        });
    } else {
        if (firstName && !resident.firstName) resident.firstName = firstName;
        if (lastName && !resident.lastName) resident.lastName = lastName;
        if (phone && !resident.phone) resident.phone = phone;
        if (mobileUserId && !resident.mobileUserId) resident.mobileUserId = mobileUserId;
    }

    resident.requestCount += 1;
    await resident.save();

    return resident;
};

// @desc    Get all requests (For the Dashboard Table)
// @route   GET /api/requests
router.get('/', protect, async (req, res) => {
    try {
        const requests = await Request.find()
            .populate('resident', 'email firstName lastName phone walletBalance totalEarned requestCount isTemporary source')
            .populate('assignedCollector', 'firstName lastName phone vehicleType vehiclePlate') // Populate correct fields from Collector model
            .sort({ createdAt: -1 }); // Newest first
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a dummy request (For testing purposes)
// @route   POST /api/requests
router.post('/', protect, async (req, res) => {
    const { residentName, wasteType, location, quantity, residentEmail, wasteImage, phone, firstName, lastName, mobileUserId } = req.body;
    try {
        if (!wasteType || typeof wasteType !== 'string') {
            return res.status(400).json({ message: 'wasteType is required' });
        }

        const exchangeRate = await ExchangeRate.findOne({
            wasteType: wasteType.trim(),
            isActive: true
        });

        if (!exchangeRate) {
            return res.status(400).json({
                message: `Invalid waste category "${wasteType}". Please choose an active category from Exchange Rate Manager.`
            });
        }

        const resident = await findOrCreateTemporaryResident({
            residentName,
            residentEmail,
            phone,
            firstName,
            lastName,
            mobileUserId
        });
        const displayName = residentName || `${resident.firstName || ''} ${resident.lastName || ''}`.trim();

        const request = await Request.create({
            residentName: displayName,
            resident: resident._id,
            wasteType: exchangeRate.wasteType,
            location,
            quantity: quantity || 1,
            residentEmail: resident.email,
            wasteImage
        });
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update request status (Approve/Reject/Complete with automatic payout)
// @route   PUT /api/requests/:id
// @access  Protected (Staff, Admin, Super Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (request) {
            const newStatus = req.body.status || request.status;
            
            // Handle payout when request is marked as Completed
            if (newStatus === 'Completed' && request.status !== 'Completed' && !request.paymentProcessed) {
                try {
                    const quantity = request.quantity || 1;
                    // Calculate payout
                    const payoutResult = await calculatePayoutAmount(request.wasteType, quantity);
                    
                    if (payoutResult.success) {
                        // Find or create the resident wallet linked to this request.
                        let resident = request.resident
                            ? await Resident.findById(request.resident)
                            : await Resident.findOne({ email: request.residentEmail });

                        if (!resident) {
                            const residentEmail = request.residentEmail || `temp-request-${request._id}@recytech.local`;
                            const parsedName = splitResidentName(request.residentName);

                            resident = await Resident.create({
                                email: residentEmail,
                                firstName: parsedName.firstName,
                                lastName: parsedName.lastName,
                                source: 'Mobile Simulation',
                                isTemporary: true
                            });
                        }
                        
                        // Update resident wallet
                        resident.walletBalance += payoutResult.amount;
                        resident.totalEarned += payoutResult.amount;
                        await resident.save();
                        
                        // Create transaction record
                        const transaction = await Transaction.create({
                            resident: resident._id,
                            type: 'Payment',
                            amount: payoutResult.amount,
                            requestId: request._id,
                            description: `Payment for ${quantity} ${request.wasteType} recycling item(s)`
                        });
                        
                        // Update request with payout info
                        request.monetaryValue = payoutResult.amount;
                        request.paymentProcessed = true;
                        request.status = newStatus;
                        request.resident = resident._id;
                        request.residentEmail = resident.email;
                        request.assignedCollector = req.body.assignedCollector || request.assignedCollector;
                        
                        const updatedRequest = await request.save();
                        
                        return res.json({
                            ...updatedRequest.toObject(),
                            payout: {
                                amount: payoutResult.amount,
                                resident: resident.email,
                                transactionId: transaction._id,
                                message: payoutResult.message
                            }
                        });
                    } else {
                        // Payout calculation failed, complete request without payment
                        console.warn(`Payout calculation failed for request ${request._id}: ${payoutResult.message}`);
                        
                        request.status = newStatus;
                        request.assignedCollector = req.body.assignedCollector || request.assignedCollector;
                        request.monetaryValue = 0;
                        request.paymentProcessed = false; // Don't mark as processed if calculation failed
                        
                        const updatedRequest = await request.save();
                        
                        return res.status(206).json({
                            ...updatedRequest.toObject(),
                            warning: `Request completed but payout failed: ${payoutResult.message}`
                        });
                    }
                } catch (payoutError) {
                    console.error('Error processing payout:', payoutError);
                    
                    // Still update status but without payment
                    request.status = newStatus;
                    request.assignedCollector = req.body.assignedCollector || request.assignedCollector;
                    request.monetaryValue = 0;
                    
                    const updatedRequest = await request.save();
                    
                    return res.status(206).json({
                        ...updatedRequest.toObject(),
                        warning: `Request completed but payout processing failed: ${payoutError.message}`
                    });
                }
            }
            
            // Standard update (no payout processing)
            request.status = newStatus;
            request.assignedCollector = req.body.assignedCollector || request.assignedCollector;
            
            const updatedRequest = await request.save();
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Protected (Admin, Super Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const request = await Request.findByIdAndDelete(req.params.id);
        if (request) {
            res.json({ message: 'Request removed' });
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get payout info for a single request
// @route   GET /api/requests/:id/payout
// @access  Protected (Admin)
router.get('/:id/payout', protect, admin, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('resident', 'email firstName lastName phone walletBalance totalEarned requestCount isTemporary source')
            .populate('assignedCollector', 'firstName lastName');
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Calculate estimated payout
        const quantity = request.quantity || 1;
        const payoutResult = await calculatePayoutAmount(request.wasteType, quantity);
        
        res.json({
            requestId: request._id,
            status: request.status,
            wasteType: request.wasteType,
            quantity,
            estimatedPayout: payoutResult.amount,
            actualPayout: request.monetaryValue,
            paymentProcessed: request.paymentProcessed,
            residentEmail: request.residentEmail,
            message: payoutResult.message
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all pending payouts (completed but not yet paid)
// @route   GET /api/requests/pending-payouts
// @access  Protected (Admin)
router.get('/pending-payouts', protect, admin, async (req, res) => {
    try {
        const pendingPayouts = await Request.find({
            status: 'Completed',
            paymentProcessed: false
        })
        .populate('assignedCollector', 'firstName lastName')
        .sort({ updatedAt: -1 });
        
        res.json(pendingPayouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
