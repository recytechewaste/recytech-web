const mongoose = require('mongoose');

const exchangeRateSchema = mongoose.Schema({
    wasteType: {
        type: String,
        required: true,
        unique: true, // One rate per waste type
        trim: true,
        example: "Electronics, Plastics, Battery, Metal, Paper"
    },
    ratePerKg: {
        type: Number,
        required: true,
        min: 0, // Rate must be non-negative
        description: "Price in PHP per kilogram"
    },
    description: {
        type: String,
        required: false,
        example: "Payment for recycled electronic waste"
    },
    isActive: {
        type: Boolean,
        default: true, // Rates can be deactivated without deleting
        description: "If false, this rate won't be used for payouts"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
