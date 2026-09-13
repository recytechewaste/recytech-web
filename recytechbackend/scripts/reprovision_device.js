/**
 * reprovision_device.js
 * ---------------------
 * Drops the existing RECYTECH-XIAO-001 record and re-provisions with a fresh secret.
 * Use ONLY when the previous credentials file is lost.
 */
const crypto     = require('crypto');
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const IoTDevice       = require('../models/IoTDevice');
const RecyclingCenter = require('../models/RecyclingCenter');

const DEVICE_ID           = 'RECYTECH-XIAO-001';
const RECYCLING_CENTER_ID = '6a88276eac828f5af9dc9268';
const FIRMWARE_VERSION    = '1.0.0';
const CREDENTIALS_FILE    = path.resolve(__dirname, 'device-credentials.json');

async function main() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected.');

    const bin = await RecyclingCenter.findById(RECYCLING_CENTER_ID).lean();
    if (!bin) { console.error('Bin not found'); process.exit(1); }

    // Remove existing record
    const del = await IoTDevice.deleteOne({ deviceId: DEVICE_ID });
    console.log(`Removed old record: ${del.deletedCount} deleted.`);

    // Generate new secret
    const plainSecret = crypto.randomBytes(32).toString('hex');
    const secretHash  = crypto.createHash('sha256').update(plainSecret).digest('hex');

    await IoTDevice.create({
        deviceId:          DEVICE_ID,
        deviceKeyHash:     secretHash,
        recyclingCenterId: RECYCLING_CENTER_ID,
        enabled:           true,
        firmwareVersion:   FIRMWARE_VERSION,
        controllerStatus:  'provisioned'
    });
    console.log(`Device ${DEVICE_ID} re-provisioned → bin ${RECYCLING_CENTER_ID} (${bin.name})`);

    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({
        warning:           'NEVER commit this file. Delete after flashing firmware.',
        deviceId:          DEVICE_ID,
        deviceSecret:      plainSecret,
        recyclingCenterId: RECYCLING_CENTER_ID,
        binName:           bin.name,
        provisionedAt:     new Date().toISOString()
    }, null, 2), 'utf-8');

    console.log(`Credentials written to: ${CREDENTIALS_FILE}`);
    await mongoose.disconnect();
    console.log('Done.');
}

main().catch(err => { console.error(err.message); mongoose.disconnect(); process.exit(1); });
