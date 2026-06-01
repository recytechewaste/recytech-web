const mongoose = require('mongoose');

const requestSchema = mongoose.Schema({
    residentName: {
        type: String,
        required: true
    },
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: false
    },
    wasteType: {
        type: String, // e.g., "Monitor", "Battery", "Phone"
        required: true
    },
    weight: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    wasteImage: {
        type: String, // URL to the image stored in Cloud/Firebase
        required: false // Optional for now
    },
    location: {
        address: { type: String, required: true },
        // We can add lat/long coordinates later for the map
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'In-Transit', 'Completed'],
        default: 'Pending'
    },
    assignedCollector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector', // Links this request to a specific Collector
        required: false
    },
    scheduledAt: {
        type: Date,
        required: false
    },
    residentEmail: {
        type: String, // Email to link request to resident account
        required: false // Optional for anonymous submissions
    },
    monetaryValue: {
        type: Number, // Calculated payout in PHP
        default: 0
    },
    paymentProcessed: {
        type: Boolean, // Tracks if payment has been issued
        default: false
    }
}, {
    timestamps: true
});

// Performance: Add indexes for frequently queried fields in Analytics & Dashboards
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ wasteType: 1 });

module.exports = mongoose.model('Request', requestSchema);
