const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    bin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
        required: [true, 'A bin ID is required for the collection request.']
    },
    lgu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerOrganization',
        required: [true, 'The partner organization ID is required.']
    },
    status: {
        type: String,
        enum: [
            'pending', 'Pending',
            'approved', 'Approved',
            'scheduled', 'Scheduled',
            'assigned', 'Assigned',
            'in_progress', 'in-progress', 'In-Progress', 'In Progress',
            'in_transit', 'in-transit', 'In-Transit', 'In Transit',
            'arrived', 'Arrived',
            'completed', 'Completed',
            'cancelled', 'Cancelled'
        ],
        default: 'pending',
        description: "The current status of the collection request."
    },
    requestType: {
        type: String,
        enum: ['automated', 'manual', 'Automated', 'Manual'],
        default: 'manual',
        description: "The type of request, either automated or manual."
    },
    assignedCollector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: false
    },
    scheduledDate: {
        type: Date
    },
    completionDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    collectedWaste: {
        type: [{
            category: { type: String, required: true },
            quantity: { type: Number, required: true, min: 0 },
            unit: { type: String, required: true }
        }],
        default: [],
        description: "Data on collected items, submitted by the collector via the mobile app upon completion."
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual alias for mobile and web consistency
requestSchema.virtual('partnerOrganization', {
    ref: 'PartnerOrganization',
    localField: 'lgu',
    foreignField: '_id',
    justOne: true
});

requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ status: 1, scheduledDate: -1 });
requestSchema.index({ bin: 1, status: 1 });
requestSchema.index({ lgu: 1, status: 1 });
requestSchema.index({ assignedCollector: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);

