/**
 * SensorReading.js
 * ----------------
 * Stores one raw distance reading from a VL53L1X ToF sensor.
 *
 * Idempotency contract:
 *  - (deviceId, readingId) is a unique compound index.
 *  - A retry of the same physical reading with the same payload → no duplicate.
 *  - A retry with a DIFFERENT distanceMm for the same readingId → 409 Conflict.
 */

const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: [true, 'deviceId is required'],
            index: true
        },
        recyclingCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RecyclingCenter',
            required: [true, 'recyclingCenterId is required'],
            index: true
        },
        readingId: {
            type: String,
            required: [true, 'readingId is required (unique per physical measurement)']
        },
        distanceMm: {
            type: Number,
            required: [true, 'distanceMm is required'],
            min: [0, 'distanceMm cannot be negative']
        },
        measuredAt: {
            type: Date,
            required: true
        },
        receivedAt: {
            type: Date,
            default: () => new Date()
        }
    },
    { timestamps: false }
);

// Compound unique index: same physical reading must not create a duplicate row
sensorReadingSchema.index({ deviceId: 1, readingId: 1 }, { unique: true });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
