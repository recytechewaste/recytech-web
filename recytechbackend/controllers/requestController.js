const Request = require('../models/Request');
const Resident = require('../models/Resident');
const Transaction = require('../models/Transaction');
const ExchangeRate = require('../models/ExchangeRate');
const { calculatePayoutAmount } = require('../utils/calculatePayout');
const { asyncHandler } = require('../utils/asyncHandler');

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

const getRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find()
        .populate('resident', 'email firstName lastName phone totalEarned requestCount isTemporary source')
        .populate('assignedCollector', 'firstName lastName phone vehicleType vehiclePlate')
        .sort({ createdAt: -1 });
    res.json(requests);
});

const createRequest = asyncHandler(async (req, res) => {
    const { residentName, wasteType, location, quantity, residentEmail, wasteImage, phone, firstName, lastName, mobileUserId } = req.body;
    
    if (!wasteType || typeof wasteType !== 'string') {
        res.status(400);
        throw new Error('wasteType is required');
    }

    const exchangeRate = await ExchangeRate.findOne({
        wasteType: wasteType.trim(),
        isActive: true
    });

    if (!exchangeRate) {
        res.status(400);
        throw new Error(`Invalid waste category "${wasteType}". Please choose an active category from Exchange Rate Manager.`);
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
});

const updateRequest = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    const newStatus = req.body.status || request.status;
    const newAssignedCollector = req.body.assignedCollector || request.assignedCollector;
    const newScheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : request.scheduledAt;

    if (req.body.scheduledAt && isNaN(newScheduledAt.getTime())) {
        res.status(400);
        throw new Error('Invalid scheduled date/time provided.');
    }

    if (newStatus === 'Approved' && newAssignedCollector && !newScheduledAt) {
        res.status(400);
        throw new Error('A scheduled date and time is required when approving a request and assigning a collector.');
    }

    if (newAssignedCollector && newScheduledAt) {
        const conflictRequest = await Request.findOne({
            _id: { $ne: request._id },
            assignedCollector: newAssignedCollector,
            scheduledAt: newScheduledAt,
            status: { $in: ['Pending', 'Approved', 'In-Transit'] }
        });

        if (conflictRequest) {
            res.status(400);
            throw new Error('Schedule conflict detected: the selected collector already has another pickup at the same date and time.');
        }
    }

    // Handle payout when request is marked as Completed
    if (newStatus === 'Completed' && request.status !== 'Completed' && !request.paymentProcessed) {
        try {
            const quantity = request.quantity || 1;
            const payoutResult = await calculatePayoutAmount(request.wasteType, quantity);
            
            if (payoutResult.success) {
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
                
                resident.walletBalance += payoutResult.amount;
                resident.totalEarned += payoutResult.amount;
                await resident.save();
                
                const transaction = await Transaction.create({
                    resident: resident._id,
                    type: 'Payment',
                    amount: payoutResult.amount,
                    requestId: request._id,
                    description: `Payment for ${quantity} ${request.wasteType} recycling item(s)`
                });
                
                request.monetaryValue = payoutResult.amount;
                request.paymentProcessed = true;
                request.status = newStatus;
                request.resident = resident._id;
                request.residentEmail = resident.email;
                request.assignedCollector = newAssignedCollector;
                request.scheduledAt = newScheduledAt;
                
                const updatedRequest = await request.save();
                return res.json({ ...updatedRequest.toObject(), payout: { amount: payoutResult.amount, resident: resident.email, transactionId: transaction._id, message: payoutResult.message } });
            } else {
                console.warn(`Payout calculation failed for request ${request._id}: ${payoutResult.message}`);
                request.status = newStatus;
                request.assignedCollector = newAssignedCollector;
                request.scheduledAt = newScheduledAt;
                request.monetaryValue = 0;
                request.paymentProcessed = false; 
                const updatedRequest = await request.save();
                return res.status(206).json({ ...updatedRequest.toObject(), warning: `Request completed but payout failed: ${payoutResult.message}` });
            }
        } catch (payoutError) {
            console.error('Error processing payout:', payoutError);
            request.status = newStatus;
            request.assignedCollector = newAssignedCollector;
            request.scheduledAt = newScheduledAt;
            request.monetaryValue = 0;
            const updatedRequest = await request.save();
            return res.status(206).json({ ...updatedRequest.toObject(), warning: `Request completed but payout processing failed: ${payoutError.message}` });
        }
    }
    
    request.status = newStatus;
    request.assignedCollector = newAssignedCollector;
    request.scheduledAt = newScheduledAt;
    
    const updatedRequest = await request.save();
    res.json(updatedRequest);
});

const deleteRequest = asyncHandler(async (req, res) => {
    const request = await Request.findByIdAndDelete(req.params.id);
    if (request) {
        res.json({ message: 'Request removed' });
    } else {
        res.status(404);
        throw new Error('Request not found');
    }
});

const getRequestPayout = asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id)
        .populate('resident', 'email firstName lastName phone totalEarned requestCount isTemporary source')
        .populate('assignedCollector', 'firstName lastName');
    
    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }
    
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
});

const getPendingPayouts = asyncHandler(async (req, res) => {
    const pendingPayouts = await Request.find({
        status: 'Completed',
        paymentProcessed: false
    })
    .populate('assignedCollector', 'firstName lastName')
    .sort({ updatedAt: -1 });
    
    res.json(pendingPayouts);
});

module.exports = {
    getRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    getRequestPayout,
    getPendingPayouts
};