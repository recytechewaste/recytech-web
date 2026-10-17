/**
 * Migration Script: Clean and Combine Duplicate Waste Categories
 * 
 * Scans all historical documents in:
 * 1. BinDropoff (wasteType)
 * 2. Request (collectedWaste[].category)
 * 
 * Maps non-canonical or variant spellings (e.g. 'cable', 'chargers', 'laptop', 'batteries')
 * into their unified canonical names defined in categoryWeights.js.
 * 
 * Usage:
 *   node scripts/cleanDuplicateCategories.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const BinDropoff = require('../models/BinDropoff');
const Request = require('../models/Request');
const { normalizeWasteCategory, CANONICAL_CATEGORIES } = require('../utils/categoryWeights');

async function migrateCategories() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables.');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        // 1. Clean BinDropoff documents
        console.log('\n📦 Checking BinDropoff records...');
        const dropoffs = await BinDropoff.find({});
        let dropoffUpdatedCount = 0;

        for (const dropoff of dropoffs) {
            const raw = dropoff.wasteType;
            const canonical = normalizeWasteCategory(raw);

            if (raw !== canonical) {
                dropoff.wasteType = canonical;
                await dropoff.save();
                dropoffUpdatedCount++;
                console.log(`  - Dropoff ${dropoff._id}: "${raw}" -> "${canonical}"`);
            }
        }
        console.log(`✅ BinDropoff cleanup complete: ${dropoffUpdatedCount} updated out of ${dropoffs.length}.`);

        // 2. Clean Request collectedWaste records
        console.log('\n🚛 Checking Request collectedWaste records...');
        const requests = await Request.find({ 'collectedWaste.0': { $exists: true } });
        let requestUpdatedCount = 0;

        for (const req of requests) {
            let modified = false;
            const updatedCollected = req.collectedWaste.map(item => {
                const raw = item.category;
                const canonical = normalizeWasteCategory(raw);
                if (raw !== canonical) {
                    modified = true;
                    console.log(`  - Request ${req._id} item: "${raw}" -> "${canonical}"`);
                    return { ...item.toObject ? item.toObject() : item, category: canonical };
                }
                return item;
            });

            if (modified) {
                req.collectedWaste = updatedCollected;
                await req.save();
                requestUpdatedCount++;
            }
        }
        console.log(`✅ Request cleanup complete: ${requestUpdatedCount} updated out of ${requests.length}.`);

        console.log('\n🎉 Category cleanup finished successfully!');
        console.log('Canonical Categories in system:');
        CANONICAL_CATEGORIES.forEach(c => console.log(`  * ${c}`));

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrateCategories();
