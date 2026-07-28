const mongoose = require('mongoose');

const rewardPointSchema = mongoose.Schema({
    wasteType: {
        type: String,
        required: true,
        unique: true, // One rate per waste type
        trim: true,
        example: "Electronics, Plastics, Battery, Metal, Paper"
    }, 
    pointsPerItem: { // Changed from pointsPerKg to pointsPerItem
        type: Number,
        min: 0,
        required: true,
        description: "Points awarded per item of waste" // Updated description
    },
    description: {
        type: String,
        required: false,
        example: "Points for recycled electronic items"
    },
    isActive: {
        type: Boolean,
        default: true, // Rates can be deactivated without deleting
        description: "If false, this rate won't be used for new transactions"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RewardPoint', rewardPointSchema);
