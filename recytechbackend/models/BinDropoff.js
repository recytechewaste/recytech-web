const mongoose = require('mongoose');

const binDropoffSchema = new mongoose.Schema({
    resident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: false,
        description: "The registered resident who made the dropoff."
    },
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecyclingCenter',
        required: true,
        description: "The bin location where the dropoff was made."
    },
    participantEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    participantName: {
        type: String,
        trim: true
    },
    wasteType: {
        type: String,
        required: true,
        trim: true,
        description: "E-waste category (e.g. Battery, Small Electronics, etc.)"
    },
    kilograms: {
        type: Number,
        default: 1,
        min: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: 0
    },
    image: {
        type: String,
        description: "Photo of the dropped-off e-waste (Data URL or hosted URL)"
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'Pending', 'approved', 'Approved', 'rejected', 'Rejected'],
        default: 'pending'
    },
    pointsAwarded: {
        type: Number,
        default: 0,
        min: 0
    },
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerOrganization',
        required: false
    },
    validatedAt: {
        type: Date
    },
    validationNotes: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    processed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual alias: dropoff.bin -> points to binId
binDropoffSchema.virtual('bin', {
    ref: 'RecyclingCenter',
    localField: 'binId',
    foreignField: '_id',
    justOne: true
});

binDropoffSchema.index({ binId: 1, status: 1 });
binDropoffSchema.index({ resident: 1, status: 1 });
binDropoffSchema.index({ status: 1, createdAt: -1 });

const BinDropoff = mongoose.model('BinDropoff', binDropoffSchema);

module.exports = BinDropoff;

