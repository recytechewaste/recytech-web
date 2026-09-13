/**
 * iotRoutes.js
 * ------------
 * Registers IoT device endpoints under /api/iot
 *
 * All routes are protected by deviceAuthMiddleware — completely separate
 * from user JWT authentication. Standard `protect` middleware is NOT used here.
 *
 * Routes:
 *   POST /api/iot/heartbeat        — device liveness ping
 *   POST /api/iot/sensor-readings  — VL53L1X distance reading ingest
 */

const express = require('express');
const router  = express.Router();
const { deviceAuth }          = require('../middleware/deviceAuthMiddleware');
const { heartbeat, submitSensorReading } = require('../controllers/iotController');

// POST /api/iot/heartbeat
router.post('/heartbeat', deviceAuth, heartbeat);

// POST /api/iot/sensor-readings
router.post('/sensor-readings', deviceAuth, submitSensorReading);

module.exports = router;
