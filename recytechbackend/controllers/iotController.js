/**
 * iotController.js
 * ----------------
 * Handles two IoT device endpoints:
 *
 *   POST /api/iot/heartbeat       — device liveness ping
 *   POST /api/iot/sensor-readings — VL53L1X distance reading ingest
 *
 * Sensor calculation (top-mounted VL53L1X):
 *   fillPercentage = ((emptyDistanceMm - distanceMm) / (emptyDistanceMm - fullDistanceMm)) * 100
 *   Clamped to [0, 100].
 *
 * Fullness vocabulary (mobile-compatible — do NOT change these strings):
 *   0–5%    → empty
 *   6–69%   → partially_filled
 *   70–94%  → nearly_full
 *   95–100% → full
 *
 * Stale-reading protection:
 *   A reading whose measuredAt is OLDER than the bin's lastSensorUpdatedAt
 *   is stored in SensorReading (audit trail) but does NOT overwrite the bin's
 *   current live state.
 *
 * Collection workflow:
 *   Sensor readings NEVER create collection requests automatically.
 *   Partner Org still creates them manually.
 *
 * Existing RecyclingCenter.status:
 *   NOT touched by this controller. It remains the operational/admin state.
 */

const crypto         = require('crypto');
const IoTDevice      = require('../models/IoTDevice');
const SensorReading  = require('../models/SensorReading');
const RecyclingCenter = require('../models/RecyclingCenter');

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Convert fill percentage to the mobile-vocabulary fullness status.
 * Uses the exact enum values expected by the Flutter Partner Org app.
 */
const toFullnessStatus = (pct) => {
    if (pct <= 5)  return 'empty';
    if (pct <= 69) return 'partially_filled';
    if (pct <= 94) return 'nearly_full';
    return 'full';
};

/**
 * Compute fill percentage from a raw VL53L1X distance reading.
 *
 * @param {number} distanceMm   - raw reading from sensor
 * @param {number} emptyDistanceMm - calibrated distance when bin is empty
 * @param {number} fullDistanceMm  - calibrated distance when bin is full
 * @returns {number} fill percentage clamped to [0, 100]
 * @throws if calibration is invalid
 */
const computeFillPercentage = (distanceMm, emptyDistanceMm, fullDistanceMm) => {
    if (emptyDistanceMm == null || fullDistanceMm == null) {
        throw new Error('MISSING_CALIBRATION');
    }
    if (typeof emptyDistanceMm !== 'number' || typeof fullDistanceMm !== 'number') {
        throw new Error('INVALID_CALIBRATION_TYPE');
    }
    if (emptyDistanceMm <= fullDistanceMm) {
        throw new Error('INVALID_CALIBRATION_RANGE: emptyDistanceMm must be greater than fullDistanceMm');
    }
    const raw = ((emptyDistanceMm - distanceMm) / (emptyDistanceMm - fullDistanceMm)) * 100;
    return Math.min(100, Math.max(0, raw));
};

// ----------------------------------------------------------------
// POST /api/iot/heartbeat
// ----------------------------------------------------------------

/**
 * @desc    Device liveness ping — updates lastSeenAt and optional metadata
 * @route   POST /api/iot/heartbeat
 * @access  Hardware auth only (deviceAuthMiddleware)
 *
 * Optional body:
 *   { "firmwareVersion": "1.0.3", "controllerStatus": "online" }
 *
 * MUST NOT alter fillPercentage, fullnessStatus, or create any requests.
 */
const heartbeat = async (req, res) => {
    try {
        const { deviceId, recyclingCenterId } = req.iotDevice;
        const { firmwareVersion, controllerStatus } = req.body || {};

        const now = new Date();

        const update = { lastSeenAt: now };
        if (firmwareVersion)  update.firmwareVersion  = firmwareVersion;
        if (controllerStatus) update.controllerStatus = controllerStatus;

        await IoTDevice.updateOne({ deviceId }, { $set: update });

        return res.status(200).json({
            success: true,
            message: 'Heartbeat acknowledged.',
            deviceId,
            recyclingCenterId,
            serverTimestamp: now.toISOString()
        });
    } catch (err) {
        console.error('[IoT heartbeat] Error:', err.message);
        return res.status(500).json({ success: false, message: 'Heartbeat failed.' });
    }
};

// ----------------------------------------------------------------
// POST /api/iot/sensor-readings
// ----------------------------------------------------------------

/**
 * @desc    Ingest a VL53L1X distance reading from a registered XIAO ESP32S3
 * @route   POST /api/iot/sensor-readings
 * @access  Hardware auth only (deviceAuthMiddleware)
 *
 * Required body:
 *   {
 *     "readingId":  "uuid-or-seq-string",   // unique per physical measurement
 *     "distanceMm": 312,                    // raw sensor output (integer mm)
 *     "measuredAt": "2026-09-14T00:00:00Z"  // optional, defaults to receivedAt
 *   }
 */
const submitSensorReading = async (req, res) => {
    try {
        const { deviceId, recyclingCenterId } = req.iotDevice;
        const { readingId, distanceMm, measuredAt: measuredAtRaw } = req.body || {};

        // --- Payload validation ---
        if (!readingId || typeof readingId !== 'string' || readingId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'readingId is required and must be a non-empty string.'
            });
        }

        if (distanceMm == null || typeof distanceMm !== 'number' || !Number.isInteger(distanceMm) || distanceMm < 0) {
            return res.status(400).json({
                success: false,
                message: 'distanceMm is required and must be a non-negative integer.'
            });
        }

        const measuredAt = measuredAtRaw ? new Date(measuredAtRaw) : new Date();
        if (isNaN(measuredAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'measuredAt must be a valid ISO 8601 UTC timestamp.'
            });
        }

        // --- Verify device has a bound RecyclingCenter ---
        if (!recyclingCenterId) {
            return res.status(422).json({
                success: false,
                message: 'Device has no associated bin. Contact the system administrator.'
            });
        }

        const bin = await RecyclingCenter.findById(recyclingCenterId);
        if (!bin) {
            return res.status(422).json({
                success: false,
                message: 'Associated RecyclingCenter not found. Device may be misconfigured.'
            });
        }

        // --- Idempotency: store raw reading (or detect conflict) ---
        let reading;
        try {
            reading = await SensorReading.create({
                deviceId,
                recyclingCenterId,
                readingId: readingId.trim(),
                distanceMm,
                measuredAt,
                receivedAt: new Date()
            });
        } catch (err) {
            if (err.code === 11000) {
                // Duplicate (deviceId, readingId) — check if payload matches
                const existing = await SensorReading.findOne({
                    deviceId,
                    readingId: readingId.trim()
                }).lean();

                if (existing && existing.distanceMm === distanceMm) {
                    // Identical retry — idempotent success
                    return res.status(200).json({
                        success: true,
                        idempotent: true,
                        message: 'Duplicate readingId with identical payload — already processed.',
                        readingId: readingId.trim()
                    });
                } else {
                    // Same readingId, different distanceMm → conflict
                    return res.status(409).json({
                        success: false,
                        message: 'Conflict: readingId already exists with a different distanceMm value.'
                    });
                }
            }
            throw err;
        }

        // --- Calibration check ---
        const { emptyDistanceMm, fullDistanceMm } = bin;
        let fillPercentage = null;
        let fullnessStatus = null;
        let calibrationError = null;

        try {
            fillPercentage = computeFillPercentage(distanceMm, emptyDistanceMm, fullDistanceMm);
            fullnessStatus = toFullnessStatus(fillPercentage);
        } catch (calErr) {
            calibrationError = calErr.message;
        }

        // --- Stale-reading protection ---
        // Only update live state if this reading is newer than the stored state.
        const isNewer = !bin.lastSensorUpdatedAt || measuredAt > bin.lastSensorUpdatedAt;

        if (calibrationError) {
            // Reading stored in audit table but bin state NOT updated — calibration not configured.
            // HTTP 422: request is valid, reading was stored, but the server cannot compute
            // fill percentage without calibration values.
            return res.status(422).json({
                success: true,
                readingStored: true,
                binUpdated: false,
                warning: `Reading stored but bin state not updated: ${calibrationError}`,
                readingId: readingId.trim(),
                distanceMm
            });
        }

        if (isNewer) {
            // Update bin sensor state — preserves all other fields
            await RecyclingCenter.findByIdAndUpdate(recyclingCenterId, {
                $set: {
                    distanceCm:          distanceMm / 10,
                    fillPercentage:      Math.round(fillPercentage * 10) / 10,
                    fullnessStatus,
                    sensorStatus:        'online',
                    controllerStatus:    req.iotDevice.controllerStatus || null,
                    lastSensorUpdatedAt: measuredAt
                }
            });
        }

        return res.status(201).json({
            success: true,
            readingStored: true,
            binUpdated:    isNewer,
            staleSkipped:  !isNewer,
            readingId:     readingId.trim(),
            distanceMm,
            distanceCm:    distanceMm / 10,
            fillPercentage: Math.round(fillPercentage * 10) / 10,
            fullnessStatus,
            measuredAt:    measuredAt.toISOString()
        });
    } catch (err) {
        console.error('[IoT sensor-readings] Error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to process sensor reading.' });
    }
};

module.exports = { heartbeat, submitSensorReading };
