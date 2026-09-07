const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please add a first name']
    },
    lastName: {
        type: String,
        required: [true, 'Please add a last name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['household', 'partner_org', 'collector', 'Staff', 'Admin', 'Super Admin', 'Collector', 'LGU', 'Partner Organization'],
        default: 'household'
    },
    status: {
        type: String,
        default: 'Active'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    resetPin: {
        type: String,
        default: null
    },
    resetPinExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);