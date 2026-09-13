/**
 * provision_device.js
 * -------------------
 * ONE-TIME provisioning script for RECYTECH-XIAO-001.
 *
 * What this does:
 *   1. Generates a high-entropy device secret (32 bytes → 64 hex chars)
 *   2. SHA-256 hashes it
 *   3. Stores ONLY the hash in MongoDB (IoTDevice collection)
 *   4. Binds the device to one RecyclingCenter by ID
 *   5. Writes the plaintext secret to a gitignored local file ONLY
 *
 * What this does NOT do:
 *   - Never stores plaintext secret in MongoDB
 *   - Never prints plaintext secret to stdout (only the file)
 *   - The output file is gitignored — NEVER commit it
 *
 * Usage:
 *   node recytechbackend/scripts/provision_device.js
 *
 * After running:
 *   - Flash device-credentials.json values into the ESP32S3 firmware
 *   - Delete device-credentials.json from this machine once flashed
 *   - The file is already in .gitignore — verify with: git status
 */

const crypto     = require('crypto');
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const IoTDevice       = require('../models/IoTDevice');
const RecyclingCenter = require('../models/RecyclingCenter');

// ================================================================
// CONFIGURE THESE BEFORE RUNNING
// ================================================================
const DEVICE_ID           = 'RECYTECH-XIAO-001';
const RECYCLING_CENTER_ID = '6a88276eac828f5af9dc9268';  // NU Trash Org
const FIRMWARE_VERSION    = '1.0.0';
// ================================================================

const CREDENTIALS_FILE = path.resolve(__dirname, 'device-credentials.json');

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('ERROR: MONGO_URI not set.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Verify target RecyclingCenter exists
    const bin = await RecyclingCenter.findById(RECYCLING_CENTER_ID).lean();
    if (!bin) {
        console.error(`ERROR: RecyclingCenter ${RECYCLING_CENTER_ID} not found.`);
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`Target bin confirmed: ${bin.name}`);

    // Check if device already provisioned
    const existing = await IoTDevice.findOne({ deviceId: DEVICE_ID }).lean();
    if (existing) {
        console.warn(`WARN: Device ${DEVICE_ID} already exists in the database.`);
        console.warn('To reprovision, manually delete the existing IoTDevice document first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    // Generate high-entropy secret (32 bytes = 256 bits)
    const plainSecret = crypto.randomBytes(32).toString('hex');

    // Hash using SHA-256 — only this goes to the database
    const secretHash = crypto.createHash('sha256').update(plainSecret).digest('hex');

    // Store in MongoDB
    const device = await IoTDevice.create({
        deviceId:          DEVICE_ID,
        deviceKeyHash:     secretHash,
        recyclingCenterId: RECYCLING_CENTER_ID,
        enabled:           true,
        firmwareVersion:   FIRMWARE_VERSION,
        controllerStatus:  'provisioned'
    });

    console.log(`Device registered: ${device.deviceId} → bin ${device.recyclingCenterId}`);

    // Write plaintext credentials to LOCAL gitignored file
    const credentials = {
        warning:           'NEVER commit this file. Delete after flashing firmware.',
        deviceId:          DEVICE_ID,
        deviceSecret:      plainSecret,
        recyclingCenterId: RECYCLING_CENTER_ID,
        binName:           bin.name,
        provisionedAt:     new Date().toISOString()
    };

    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf-8');
    console.log(`\nCredentials written to: ${CREDENTIALS_FILE}`);
    console.log('>>> Flash deviceId and deviceSecret into your ESP32S3 firmware.');
    console.log('>>> Delete the credentials file from this machine after flashing.');
    console.log('>>> NEVER commit this file — it is gitignored but double-check: git status\n');

    await mongoose.disconnect();
    console.log('Done. Disconnected.');
}

main().catch(err => {
    console.error('Provisioning failed:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
