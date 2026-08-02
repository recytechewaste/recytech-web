const mongoose = require('mongoose');

const binDropoffSchema = new mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: true,
        description: "The resident who made the dropoff."
    },
    bin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
        required: true,
        description: "The bin where the dropoff was made."
    },
    date: {
        type: Date,
        default: Date.now,
        description: "The date and time of the dropoff."
    },
    processed: {
        type: Boolean,
        default: false,
        description: "A flag to indicate if the dropoff has been processed for reward points."
    }
}, {
    timestamps: true
});

binDropoffSchema.index({ bin: 1, processed: 1 });
binDropoffSchema.index({ resident: 1 });

const BinDropoff = mongoose.model('BinDropoff', binDropoffSchema);

module.exports = BinDropoff;
