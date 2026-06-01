const mongoose = require('mongoose');

const residentSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        description: "Unique email identifier for resident"
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false, // Kept false so automated requests can still create temporary anonymous residents
        select: false, // Security: Prevents the hashed password from being sent when fetching residents
        description: "Hashed password for mobile app authentication"
    },
    phone: {
        type: String,
        required: false
    },
    source: {
        type: String,
        enum: ['Mobile Simulation', 'Mobile App', 'Web', 'Imported'],
        default: 'Mobile Simulation',
        description: "Where this resident profile came from"
    },
    isTemporary: {
        type: Boolean,
        default: true,
        description: "Temporary profile used until mobile accounts are integrated"
    },
    mobileUserId: {
        type: String,
        required: false,
        trim: true,
        description: "Future link to the mobile app account/user ID"
    },
    totalEarned: {
        type: Number,
        default: 0,
        min: 0,
        description: "Total amount earned from all completed requests in PHP"
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
        description: "Current withdrawable balance in PHP"
    },
    requestCount: {
        type: Number,
        default: 0,
        min: 0,
        description: "Total number of requests submitted by resident"
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        description: "Account status - can be deactivated by admin"
    }
}, {
    timestamps: true
});

// Performance: Index for chronological sorting and analytics date-range queries
residentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resident', residentSchema);
