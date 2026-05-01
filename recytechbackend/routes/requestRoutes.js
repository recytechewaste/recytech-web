const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const { calculatePayoutAmount } = require('../utils/calculatePayout');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all requests (For the Dashboard Table)
// @route   GET /api/requests
router.get('/', protect, async (req, res) => {
    try {
        const requests = await Request.find()
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
    const { residentName, wasteType, location } = req.body;
    try {
        const request = await Request.create({
            residentName,
            wasteType,
            location
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
                    // Calculate payout
                    const payoutResult = await calculatePayoutAmount(request.wasteType, request.weight);
                    
                    if (payoutResult.success) {
                        // Generate resident email (use provided or create anonymous)
                        const residentEmail = request.residentEmail || `anon-${request._id}@recytech.local`;
                        
                        // Find or create resident
                        let resident = await Resident.findOne({ email: residentEmail });
                        if (!resident) {
                            resident = await Resident.create({
                                email: residentEmail,
                                firstName: request.residentName.split(' ')[0] || 'Anonymous',
                                lastName: request.residentName.split(' ')[1] || 'Resident'
                            });
                        }
                        
                        // Update resident wallet
                        resident.walletBalance += payoutResult.amount;
                        resident.totalEarned += payoutResult.amount;
                        resident.requestCount += 1;
                        await resident.save();
                        
                        // Create transaction record
                        const transaction = await Transaction.create({
                            resident: resident._id,
                            type: 'Payment',
                            amount: payoutResult.amount,
                            requestId: request._id,
                            description: `Payment for ${request.weight}kg ${request.wasteType} recycling`
                        });
                        
                        // Update request with payout info
                        request.monetaryValue = payoutResult.amount;
                        request.paymentProcessed = true;
                        request.status = newStatus;
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
            .populate('assignedCollector', 'firstName lastName');
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Calculate estimated payout
        const payoutResult = await calculatePayoutAmount(request.wasteType, request.weight);
        
        res.json({
            requestId: request._id,
            status: request.status,
            wasteType: request.wasteType,
            weight: request.weight,
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
