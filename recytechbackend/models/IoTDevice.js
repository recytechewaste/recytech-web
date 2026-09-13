/**
 * IoTDevice.js
 * ------------
 * Represents a registered hardware controller (e.g. XIAO ESP32S3)
 * that is authorized to push sensor readings to the backend.
 *
 * Security contract:
 *  - deviceKeyHash stores SHA-256(secret) ONLY — never the plaintext secret.
 *  - The plaintext secret is generated once at provisioning time, printed to
 *    a gitignored local file, and NEVER stored in the database.
 */

const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, 'deviceId is required'],
            unique: true,
            trim: true,
            index: true
        },
        deviceKeyHash: {
            type: String,
            required: [true, 'deviceKeyHash is required']
            // SHA-256 hex of the plaintext device secret
        },
        recyclingCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RecyclingCenter',
            required: [true, 'recyclingCenterId is required'],
            index: true
        },
        enabled: {
            type: Boolean,
            default: true
        },
        firmwareVersion: {
            type: String,
            default: null
        },
        controllerStatus: {
            type: String,
            default: 'unknown'
        },
        lastSeenAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('IoTDevice', iotDeviceSchema);
