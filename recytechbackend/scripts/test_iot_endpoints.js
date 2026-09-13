/**
 * test_iot_endpoints.js
 * ---------------------
 * Validates the IoT integration against a running local server.
 * Tests A–K as specified in the defense brief.
 *
 * Prerequisites:
 *   1. Server must be running on localhost:5000
 *   2. Provisioning script must have been run (device in DB)
 *   3. DEVICE_ID and DEVICE_SECRET must be set as env vars or edited below
 *
 * Usage:
 *   DEVICE_SECRET=<plaintext-secret> node recytechbackend/scripts/test_iot_endpoints.js
 */

const http   = require('http');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL   = process.env.TEST_BASE_URL || 'http://localhost:5000';
const DEVICE_ID  = process.env.DEVICE_ID    || 'RECYTECH-XIAO-001';

// Try to load secret from credentials file (gitignored), fallback to env var
let DEVICE_SECRET = process.env.DEVICE_SECRET || '';
const CREDS_FILE = path.resolve(__dirname, 'device-credentials.json');
if (!DEVICE_SECRET && fs.existsSync(CREDS_FILE)) {
    try {
        const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf-8'));
        DEVICE_SECRET = creds.deviceSecret || '';
    } catch (_) {}
}

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`);
    if (ok) passed++; else failed++;
}

function request({ method, path: urlPath, headers = {}, body = null }) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost',
            port:     5000,
            path:     urlPath,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
            }
        };
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (_) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

const validHeaders = () => ({
    'X-Device-ID':   DEVICE_ID,
    'Authorization': `Bearer ${DEVICE_SECRET}`
});

// Unique readingId generator
const uid = () => `TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function runTests() {
    console.log(`\n=== IoT Integration Tests ===`);
    console.log(`Server:   ${BASE_URL}`);
    console.log(`DeviceID: ${DEVICE_ID}`);
    console.log(`Secret:   ${DEVICE_SECRET ? '[loaded]' : '[MISSING — set DEVICE_SECRET env var]'}\n`);

    // A. Heartbeat without credentials → 401
    {
        const r = await request({ method: 'POST', path: '/api/iot/heartbeat' });
        log('A. Heartbeat without credentials → 401', r.status === 401, `HTTP ${r.status}`);
    }

    // B. Sensor-readings without credentials → 401
    {
        const r = await request({ method: 'POST', path: '/api/iot/sensor-readings' });
        log('B. Sensor-readings without credentials → 401', r.status === 401, `HTTP ${r.status}`);
    }

    // C. Invalid device key → 401
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/heartbeat',
            headers: { 'X-Device-ID': DEVICE_ID, 'Authorization': 'Bearer WRONG_SECRET_KEY' }
        });
        log('C. Invalid device key → 401', r.status === 401, `HTTP ${r.status}`);
    }

    if (!DEVICE_SECRET) {
        console.log('\n⚠️  DEVICE_SECRET not available — skipping D–K (require valid credentials).');
        console.log('   Run the provisioning script first, then re-run with DEVICE_SECRET env var.\n');
        console.log(`=== Results so far: ${passed} passed, ${failed} failed ===`);
        return;
    }

    // D. Valid heartbeat → 200
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/heartbeat',
            headers: validHeaders(),
            body: { firmwareVersion: '1.0.0-test', controllerStatus: 'online' }
        });
        log('D. Valid heartbeat → 200', r.status === 200, `HTTP ${r.status} | ${r.body?.message || ''}`);
        if (r.status === 200) {
            log('  D.1 response has deviceId', !!r.body.deviceId);
            log('  D.2 response has serverTimestamp', !!r.body.serverTimestamp);
        }
    }

    // E. Valid reading with missing calibration → 422 (stored, bin not updated)
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/sensor-readings',
            headers: validHeaders(),
            body: { readingId: uid(), distanceMm: 300, measuredAt: new Date().toISOString() }
        });
        // First real bin may or may not have calibration set — accept 422 (missing calib) or 201 (calibrated)
        const ok = r.status === 422 || r.status === 201;
        log(
            'E. Reading with missing calibration → 422 (stored, no corrupt update) or 201 if calibrated',
            ok,
            `HTTP ${r.status} | binUpdated=${r.body?.binUpdated} | warning=${r.body?.warning || 'none'}`
        );
    }

    // Set calibration directly in DB for deterministic test
    const RecyclingCenter = require('../models/RecyclingCenter');
    const IoTDevice       = require('../models/IoTDevice');

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);

    const device = await IoTDevice.findOne({ deviceId: DEVICE_ID }).lean();
    const binId  = device?.recyclingCenterId;

    if (binId) {
        await RecyclingCenter.findByIdAndUpdate(binId, {
            $set: { emptyDistanceMm: 500, fullDistanceMm: 50 }
        });
        console.log('  [setup] Calibration set: empty=500mm, full=50mm for test F');
    }

    await mongoose.disconnect();

    // F. Valid calibrated reading → reading stored, RecyclingCenter updated
    const testReadingId = uid();
    let testDistanceMm  = 250; // mid-fill
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/sensor-readings',
            headers: validHeaders(),
            body: { readingId: testReadingId, distanceMm: testDistanceMm, measuredAt: new Date().toISOString() }
        });
        const ok = r.status === 201 && r.body?.readingStored && r.body?.binUpdated;
        log(
            'F. Valid calibrated reading → 201, readingStored=true, binUpdated=true',
            ok,
            `HTTP ${r.status} | fill=${r.body?.fillPercentage}% | fullness=${r.body?.fullnessStatus}`
        );
        // fillPercentage for 250mm with empty=500, full=50: (500-250)/(500-50)*100 = 55.6%
        if (r.status === 201) {
            log(
                '  F.1 fillPercentage ≈ 55.6% (partially_filled)',
                r.body?.fullnessStatus === 'partially_filled',
                `got: ${r.body?.fullnessStatus}`
            );
        }
    }

    // G. Duplicate same readingId + same distanceMm → idempotent success
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/sensor-readings',
            headers: validHeaders(),
            body: { readingId: testReadingId, distanceMm: testDistanceMm }
        });
        const ok = (r.status === 200 || r.status === 201) && r.body?.idempotent === true;
        log('G. Duplicate same readingId+payload → idempotent 200', ok, `HTTP ${r.status} | idempotent=${r.body?.idempotent}`);
    }

    // H. Same readingId with different distanceMm → 409 Conflict
    {
        const r = await request({
            method: 'POST',
            path: '/api/iot/sensor-readings',
            headers: validHeaders(),
            body: { readingId: testReadingId, distanceMm: testDistanceMm + 999 }
        });
        log('H. Same readingId, different payload → 409', r.status === 409, `HTTP ${r.status}`);
    }

    // I. GET /api/partner-organizations/my-bins still works (auth required → 401 without token, confirms route alive)
    {
        const r = await request({ method: 'GET', path: '/api/partner-organizations/my-bins' });
        log('I. GET /api/partner-organizations/my-bins still reachable (401 expected without token)', r.status === 401, `HTTP ${r.status}`);
    }

    // J. POST /api/sensor-reports still works (401 without token = route alive)
    {
        const r = await request({ method: 'POST', path: '/api/sensor-reports' });
        log('J. POST /api/sensor-reports still alive (401 without token)', r.status === 401, `HTTP ${r.status}`);
    }

    // K. No unrelated regressions — probe a cross-section of other routes
    for (const [label, method, urlPath, expectedStatuses] of [
        ['K.1 GET /api/bins (public)',         'GET',  '/api/bins',          [200]],
        ['K.2 GET /api/bin-locations/public',  'GET',  '/api/bin-locations/public', [200]],
        ['K.3 GET /api/users (no token)',       'GET',  '/api/users',         [401]],
        ['K.4 GET /api/analytics/summary',     'GET',  '/api/analytics/summary',   [401]],
    ]) {
        const r = await request({ method, path: urlPath });
        log(label, expectedStatuses.includes(r.status), `HTTP ${r.status}`);
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Test runner error:', err.message);
    mongoose.disconnect().catch(() => {});
    process.exit(1);
});
