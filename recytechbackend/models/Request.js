const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    bin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
        required: [true, 'A bin ID is required for the collection request.']
    },
    lgu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LguAccount',
        required: [true, 'The LGU account ID is required.']
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'pending',
        description: "The current status of the collection request."
    },
    requestType: {
        type: String,
        enum: ['automated', 'manual'],
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
    timestamps: true
});

requestSchema.index({ status: 1, scheduledDate: -1 });
requestSchema.index({ bin: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
