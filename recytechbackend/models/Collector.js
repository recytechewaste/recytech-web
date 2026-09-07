const mongoose = require('mongoose');

const collectorSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    vehiclePlate: { type: String, default: 'Not Assigned' },
    vehicleType: { 
        type: String, 
        enum: ['Not Assigned', 'Motorcycle', 'Van', 'Truck', 'E-Trike', 'Bike', 'Other'],
        default: 'Not Assigned'
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'],
        default: 'Active' 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Collector', collectorSchema);

