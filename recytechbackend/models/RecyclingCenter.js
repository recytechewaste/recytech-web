const mongoose = require('mongoose');

const recyclingCenterSchema = mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true }, // e.g., Barangay
    address: { type: String, required: true },
    items: { type: String, required: true }, // e.g., "Plastic, Metal, Electronics"
    status: { type: String, default: 'Operational' }, // Operational, Under Maintenance, Closed
}, {
    timestamps: true
});

module.exports = mongoose.model('RecyclingCenter', recyclingCenterSchema);
