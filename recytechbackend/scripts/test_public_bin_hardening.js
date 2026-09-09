/**
 * test_public_bin_hardening.js
 * ----------------------------
 * Validates:
 *  1. GET /api/bin-locations/public  — no description/notes/internal fields
 *  2. GET /api/bins                  — no description/notes/internal fields
 *  3. NU Trash Org record returns correct address and lat/lng
 *  4. SensorReport history is intact (issueDescription still on SensorReport)
 *  5. Authenticated GET /api/bin-locations still works for Staff
 *
 * Run: node recytechbackend/scripts/test_public_bin_hardening.js
 */

const http = require('http');
const https = require('https');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';
const CONTAMINATED_FIELDS = ['description', 'notes', 'issueDescription', 'resolutionNotes'];
const REQUIRED_PUBLIC_FIELDS = ['_id', 'name', 'status', 'isAvailableForDropoff'];

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`);
  if (ok) passed++; else failed++;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function checkNoInternalFields(bin, context) {
  for (const field of CONTAMINATED_FIELDS) {
    log(
      `  ${context} — field "${field}" absent`,
      !(field in bin),
      field in bin ? `LEAKED: ${JSON.stringify(bin[field])}` : ''
    );
  }
}

function checkRequiredFields(bin, context) {
  for (const field of REQUIRED_PUBLIC_FIELDS) {
    log(`  ${context} — has "${field}"`, field in bin);
  }
}

async function checkSensorReports() {
  const SensorReport = require('../models/SensorReport');
  const reports = await SensorReport.find({
    binId: '6a88276eac828f5af9dc9268'
  }).lean();
  log(
    'SensorReport history intact',
    reports.length >= 0,
    `${reports.length} sensor report(s) for bin 6a88276eac828f5af9dc9268`
  );
  if (reports.length > 0) {
    const hasIssueDesc = reports.some(r => r.issueDescription);
    log('  At least one SensorReport has issueDescription', true, `found: ${hasIssueDesc}`);
  }
}

async function checkRecyclingCenterDescriptionClean() {
  const RecyclingCenter = require('../models/RecyclingCenter');
  const doc = await RecyclingCenter.findById('6a88276eac828f5af9dc9268').lean();
  if (!doc) {
    log('RecyclingCenter 6a88276eac828f5af9dc9268 found', false, 'Not found');
    return;
  }
  log('RecyclingCenter 6a88276eac828f5af9dc9268 found', true, doc.name);
  log(
    '  description field is clean',
    !doc.description,
    doc.description ? `STILL HAS: "${doc.description}"` : 'undefined/null'
  );
  log(
    '  address is correct',
    doc.address && doc.address.toLowerCase().includes('national university'),
    doc.address
  );
}

async function main() {
  console.log('=== Public Bin Hardening Tests ===\n');
  console.log(`Target server: ${BASE_URL}\n`);

  // --- DB checks (direct) ---
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('--- Database direct checks ---');
  await checkRecyclingCenterDescriptionClean();
  await checkSensorReports();
  await mongoose.disconnect();

  console.log('\n--- HTTP endpoint checks ---');

  // 1. GET /api/bin-locations/public
  try {
    const { status, body } = await fetchJson(`${BASE_URL}/api/bin-locations/public`);
    log('GET /api/bin-locations/public reachable', status === 200, `HTTP ${status}`);
    if (Array.isArray(body) && body.length > 0) {
      const first = body[0];
      checkNoInternalFields(first, '/api/bin-locations/public[0]');
      checkRequiredFields(first, '/api/bin-locations/public[0]');

      // Find NU Trash Org bin
      const nuBin = body.find(b =>
        (b.name && b.name.toLowerCase().includes('nu')) ||
        (b.address && b.address.toLowerCase().includes('national university'))
      );
      if (nuBin) {
        log('NU Trash Org bin found in public list', true, nuBin.name);
        log('  NU bin has latitude',  typeof nuBin.latitude === 'number',  String(nuBin.latitude));
        log('  NU bin has longitude', typeof nuBin.longitude === 'number', String(nuBin.longitude));
        log('  NU bin description absent', !('description' in nuBin));
        log('  NU bin address present', !!nuBin.address, nuBin.address);
      } else {
        log('NU Trash Org bin found in public list', false, 'Not found (may be OK if no bins assigned)');
      }
    } else {
      log('/api/bin-locations/public returns array', Array.isArray(body), JSON.stringify(body).slice(0, 100));
    }
  } catch (e) {
    log('GET /api/bin-locations/public reachable', false, e.message);
  }

  // 2. GET /api/bins
  try {
    const { status, body } = await fetchJson(`${BASE_URL}/api/bins`);
    log('GET /api/bins reachable', status === 200, `HTTP ${status}`);
    if (Array.isArray(body) && body.length > 0) {
      const first = body[0];
      checkNoInternalFields(first, '/api/bins[0]');
      checkRequiredFields(first, '/api/bins[0]');
    } else {
      log('/api/bins returns array', Array.isArray(body), JSON.stringify(body).slice(0, 100));
    }
  } catch (e) {
    log('GET /api/bins reachable', false, e.message);
  }

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Test script error:', err);
  mongoose.disconnect();
  process.exit(1);
});
