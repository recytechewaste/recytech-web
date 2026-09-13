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
    qrCodeImage: {
        type: String,  // Base64 data URL of generated QR PNG
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
        enum: ['Empty', 'Operational', 'Full', 'Maintenance', 'Active'],
        default: 'Empty'
    },
    description: {
        type: String
    },
    assignedCollector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: false
    },
    assignedLgu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartnerOrganization',
        required: false
    },

    // ---------------------------------------------------------------
    // IoT / Sensor fields — added for VL53L1X ToF integration.
    // These are SEPARATE from the operational `status` field above.
    // Managed only by the /api/iot/sensor-readings ingest pipeline.
    // ---------------------------------------------------------------

    /** Latest sensor distance reading converted to centimeters */
    distanceCm: {
        type: Number,
        default: null
    },
    /** Computed fill level 0–100 (clamped) from calibrated distance */
    fillPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    /**
     * Sensor-derived fullness label.
     * Values: empty | partially_filled | nearly_full | full | sensor_offline | requires_inspection
     * Must NOT be repurposed as the operational/admin status.
     */
    fullnessStatus: {
        type: String,
        enum: ['empty', 'partially_filled', 'nearly_full', 'full', 'sensor_offline', 'requires_inspection'],
        default: null
    },
    /** Hardware communication state: online | offline | error */
    sensorStatus: {
        type: String,
        enum: ['online', 'offline', 'error'],
        default: null
    },
    /** Microcontroller reported state string (e.g. "online", "booting") */
    controllerStatus: {
        type: String,
        default: null
    },
    /** UTC timestamp of the last successfully processed sensor reading */
    lastSensorUpdatedAt: {
        type: Date,
        default: null
    },

    // Calibration: per-bin distances for VL53L1X top-mounted sensor
    /** Distance (mm) from sensor to bin bottom when completely empty */
    emptyDistanceMm: {
        type: Number,
        default: null
    },
    /** Distance (mm) that represents 100%-full threshold */
    fullDistanceMm: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

recyclingCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RecyclingCenter', recyclingCenterSchema);
