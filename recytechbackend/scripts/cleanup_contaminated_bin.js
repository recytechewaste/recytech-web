/**
 * cleanup_contaminated_bin.js
 * ----------------------------
 * One-shot script: unsets the contaminated `description` field on
 * RecyclingCenter / bin ID: 6a88276eac828f5af9dc9268
 *
 * Root cause: partnerOrgController.updateMyBinStatus() was writing
 * incoming `notes` into RecyclingCenter.description.
 * This script removes ONLY that description value.
 * SensorReport history is NOT touched.
 *
 * Run: node recytechbackend/scripts/cleanup_contaminated_bin.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const RecyclingCenter = require('../models/RecyclingCenter');

const TARGET_ID = '6a88276eac828f5af9dc9268';
const EXPECTED_CONTAMINATED_VALUE = 'naapaw na';

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const doc = await RecyclingCenter.findById(TARGET_ID).lean();

  if (!doc) {
    console.error(`ERROR: RecyclingCenter ${TARGET_ID} not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found: ${doc.name}`);
  console.log(`  current description: ${JSON.stringify(doc.description)}`);

  if (doc.description === EXPECTED_CONTAMINATED_VALUE) {
    const result = await RecyclingCenter.updateOne(
      { _id: TARGET_ID },
      { $unset: { description: '' } }
    );
    console.log(`  $unset result:`, result);
    console.log('  ✅  description field removed successfully.');
  } else if (!doc.description) {
    console.log('  ℹ️  description is already empty/unset — no action needed.');
  } else {
    console.warn(`  ⚠️  description value is "${doc.description}", expected "${EXPECTED_CONTAMINATED_VALUE}".`);
    console.warn('  Skipping to avoid unintended data modification. Review manually.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Verify
  const after = await RecyclingCenter.findById(TARGET_ID).lean();
  console.log(`  post-cleanup description: ${JSON.stringify(after.description)}`);
  console.log(`  address: ${after.address}`);

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

main().catch(err => {
  console.error('Script failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
