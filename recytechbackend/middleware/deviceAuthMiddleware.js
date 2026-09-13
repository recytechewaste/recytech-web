/**
 * deviceAuthMiddleware.js
 * -----------------------
 * Hardware-only authentication for IoT endpoints.
 * Completely separate from user JWT authentication.
 *
 * Expected request headers:
 *   X-Device-ID:     <device-id>           e.g. "RECYTECH-XIAO-001"
 *   Authorization:   Bearer <device-secret> (plaintext, sent over HTTPS only)
 *
 * Verification flow:
 *   1. Extract deviceId from X-Device-ID header
 *   2. Extract secret from Authorization: Bearer header
 *   3. Look up IoTDevice by deviceId
 *   4. SHA-256 hash the presented secret
 *   5. Compare hash against stored deviceKeyHash using timingSafeEqual
 *   6. Reject if device is unknown, disabled, or hash mismatch
 *   7. Attach device doc to req.iotDevice and proceed
 *
 * Security guarantees:
 *   - Constant-time comparison prevents timing attacks
 *   - Plaintext secret is NEVER logged, stored, or echoed in responses
 *   - All communication MUST be over HTTPS (enforced by Render TLS)
 */

const crypto = require('crypto');
const IoTDevice = require('../models/IoTDevice');

const deviceAuth = async (req, res, next) => {
    try {
        // --- Extract credentials ---
        const deviceId = req.headers['x-device-id'];
        const authHeader = req.headers['authorization'];

        if (!deviceId || !authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Device authentication required. Provide X-Device-ID and Authorization: Bearer <secret> headers.'
            });
        }

        const presentedSecret = authHeader.slice(7); // strip "Bearer "

        if (!presentedSecret || presentedSecret.length < 16) {
            return res.status(401).json({
                success: false,
                message: 'Invalid device credentials.'
            });
        }

        // --- Look up device ---
        const device = await IoTDevice.findOne({ deviceId }).lean();

        if (!device) {
            // Use generic message — do NOT reveal whether deviceId exists
            return res.status(401).json({
                success: false,
                message: 'Device authentication failed.'
            });
        }

        if (!device.enabled) {
            return res.status(403).json({
                success: false,
                message: 'Device is disabled. Contact the system administrator.'
            });
        }

        // --- Hash presented secret and compare in constant time ---
        const presentedHash = crypto
            .createHash('sha256')
            .update(presentedSecret)
            .digest('hex');

        const storedHashBuf = Buffer.from(device.deviceKeyHash, 'hex');
        const presentedHashBuf = Buffer.from(presentedHash, 'hex');

        // Constant-time comparison (prevents timing side-channel)
        if (storedHashBuf.length !== presentedHashBuf.length ||
            !crypto.timingSafeEqual(storedHashBuf, presentedHashBuf)) {
            return res.status(401).json({
                success: false,
                message: 'Device authentication failed.'
            });
        }

        // --- Auth successful — attach device (without secret) ---
        req.iotDevice = {
            _id:               device._id,
            deviceId:          device.deviceId,
            recyclingCenterId: device.recyclingCenterId,
            firmwareVersion:   device.firmwareVersion,
            controllerStatus:  device.controllerStatus
        };

        return next();
    } catch (err) {
        console.error('[deviceAuth] Unexpected error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during device authentication.'
        });
    }
};

module.exports = { deviceAuth };
