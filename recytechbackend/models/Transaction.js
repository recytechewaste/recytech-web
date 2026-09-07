const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: true,
        description: "Reference to the resident who received the payment"
    },
    type: {
        type: String,
        enum: ['Payment', 'Refund', 'Adjustment', 'Redemption'],
        required: true,
        description: "Type of transaction"
    },
    points: {
        type: Number,
        required: true,
        min: 0,
        description: "Points awarded or deducted"
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: false,
        description: "Reference to the collection request this transaction is related to"
    },
    dropoffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BinDropoff',
        required: false,
        description: "Reference to the validated bin drop-off this transaction is related to"
    },
    description: {
        type: String,
        required: false,
        example: "Payment for 2 Battery recycling item(s)"
    }
}, {
    timestamps: true
});

transactionSchema.index({ resident: 1, createdAt: -1 });
transactionSchema.index({ dropoffId: 1 });
transactionSchema.index({ requestId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

