const mongoose = require('mongoose');

const recyclingCenterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    qrCode: {
        type: String,
        trim: true
    },
    capacityKg: {
        type: Number,
        default: 500,
        min: 0
    },
    currentFillKg: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['Empty', 'Full', 'Maintenance'],
        default: 'Empty'
    },
    description: {
        type: String
    },
    assignedCollector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: false
    }
}, {
    timestamps: true
});

recyclingCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RecyclingCenter', recyclingCenterSchema);
