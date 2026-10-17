const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Models used for Analytics & Reports
const Request = require('./models/Request');
const BinDropoff = require('./models/BinDropoff');
const RecyclingCenter = require('./models/RecyclingCenter');
const PartnerOrganization = require('./models/PartnerOrganization');
const Collector = require('./models/Collector');
const User = require('./models/User');

const MOCK_TAG = 'DEMO_SEED_ANALYTICS';

/**
 * Clean & Focused 5 Core Categories (Prevents Pie Chart Crowding):
 * 1. Laptop (2.0 kg)
 * 2. Smartphone (0.18 kg)
 * 3. Batteries (0.05 kg)
 * 4. Keyboard (0.60 kg)
 * 5. Cables & Chargers (0.15 kg)
 */

async function runSeed() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully.');

        // 1. CLEANUP OPTION: node recytechbackend/seedAnalytics.js --clean
        if (process.argv.includes('--clean')) {
            console.log('🧹 Cleaning up mock analytics data...');
            const reqRes = await Request.deleteMany({ notes: MOCK_TAG });
            const dropRes = await BinDropoff.deleteMany({ notes: MOCK_TAG });
            console.log(`✅ Deleted ${reqRes.deletedCount} mock requests and ${dropRes.deletedCount} mock dropoffs.`);
            console.log('✨ Database is clean again!');
            process.exit(0);
        }

        // Clean existing mock data first before re-seeding to prevent duplicates
        await Request.deleteMany({ notes: MOCK_TAG });
        await BinDropoff.deleteMany({ notes: MOCK_TAG });

        // 2. FETCH OR CREATE VALID PARTNER ORGANIZATION & RECYCLING CENTER (BIN)
        let sampleLgu = await PartnerOrganization.findOne();
        if (!sampleLgu) {
            console.log('ℹ️ No Partner Organization found. Creating a demo Partner Organization...');
            sampleLgu = await PartnerOrganization.create({
                name: 'RecyTech Demo LGU Partner',
                contactPerson: 'Admin Officer',
                email: 'demo_partner_lgu@recytech.org',
                password: 'HashedPassword123!',
                status: 'Active'
            });
        }

        let sampleBin = await RecyclingCenter.findOne();
        if (!sampleBin) {
            console.log('ℹ️ No Bin / Recycling Center found. Creating a demo Bin...');
            sampleBin = await RecyclingCenter.create({
                name: 'Central Eco Smart Bin',
                address: 'Barangay Central Hall, Zone 1',
                status: 'Operational',
                capacityKg: 60,
                currentFillKg: 15,
                assignedLgu: sampleLgu._id
            });
        }

        // 3. FETCH OR CREATE AN ASSIGNED COLLECTOR (So requests are never 'Unassigned')
        let sampleCollector = await Collector.findOne({ status: 'Active' });
        if (!sampleCollector) {
            sampleCollector = await Collector.findOne();
        }
        if (!sampleCollector) {
            console.log('ℹ️ No Collector found. Creating a demo Collector profile...');
            let collectorUser = await User.findOne({ role: 'Collector' });
            if (!collectorUser) {
                collectorUser = await User.create({
                    firstName: 'Eco',
                    lastName: 'Collector',
                    email: 'demo_collector@recytech.org',
                    password: 'HashedPassword123!',
                    role: 'Collector',
                    status: 'Active'
                });
            }
            sampleCollector = await Collector.create({
                user: collectorUser._id,
                firstName: collectorUser.firstName || 'Eco',
                lastName: collectorUser.lastName || 'Collector',
                phone: '09123456789',
                vehiclePlate: 'RCY-8888',
                vehicleType: 'Truck',
                status: 'Active'
            });
        }

        const binId = sampleBin._id;
        const lguId = sampleLgu._id;
        const collectorId = sampleCollector._id;

        console.log(`📍 Using Bin       : "${sampleBin.name}" (${binId})`);
        console.log(`🏛️ Using Partner Org: "${sampleLgu.name}" (${lguId})`);
        console.log(`🚚 Using Collector  : "${sampleCollector.firstName} ${sampleCollector.lastName}" [${sampleCollector.vehicleType} - ${sampleCollector.vehiclePlate}] (${collectorId})`);
        console.log('🌱 Generating 3 months of collection & drop-off data with 5 clean categories...');

        const now = new Date();
        const monthsAgo = (m, dayOffset = 0) => {
            return new Date(now.getFullYear(), now.getMonth() - m, 12 + dayOffset);
        };

        // 4. MOCK COMPLETED COLLECTION REQUESTS (All with assignedCollector!)
        const mockRequests = [
            // --- 2 MONTHS AGO (e.g. July - Base Month) ---
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Smartphone', quantity: 6, unit: 'items' },
                    { category: 'Laptop', quantity: 2, unit: 'items' }
                ],
                completionDate: monthsAgo(2, -6),
                createdAt: monthsAgo(2, -10),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Batteries', quantity: 20, unit: 'items' },
                    { category: 'Cables & Chargers', quantity: 15, unit: 'items' }
                ],
                completionDate: monthsAgo(2, 2),
                createdAt: monthsAgo(2, -1),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Keyboard', quantity: 4, unit: 'items' },
                    { category: 'Smartphone', quantity: 5, unit: 'items' }
                ],
                completionDate: monthsAgo(2, 8),
                createdAt: monthsAgo(2, 5),
                notes: MOCK_TAG
            },

            // --- 1 MONTH AGO (e.g. August - Growth Month) ---
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Laptop', quantity: 4, unit: 'items' },
                    { category: 'Smartphone', quantity: 14, unit: 'items' }
                ],
                completionDate: monthsAgo(1, -7),
                createdAt: monthsAgo(1, -11),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Batteries', quantity: 45, unit: 'items' },
                    { category: 'Cables & Chargers', quantity: 25, unit: 'items' }
                ],
                completionDate: monthsAgo(1, -1),
                createdAt: monthsAgo(1, -4),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Keyboard', quantity: 8, unit: 'items' },
                    { category: 'Smartphone', quantity: 10, unit: 'items' }
                ],
                completionDate: monthsAgo(1, 5),
                createdAt: monthsAgo(1, 2),
                notes: MOCK_TAG
            },

            // --- CURRENT MONTH (e.g. September - High Growth Month) ---
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Laptop', quantity: 8, unit: 'items' },
                    { category: 'Smartphone', quantity: 24, unit: 'items' }
                ],
                completionDate: monthsAgo(0, -9),
                createdAt: monthsAgo(0, -12),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Batteries', quantity: 70, unit: 'items' },
                    { category: 'Cables & Chargers', quantity: 40, unit: 'items' }
                ],
                completionDate: monthsAgo(0, -5),
                createdAt: monthsAgo(0, -8),
                notes: MOCK_TAG
            },
            {
                bin: binId,
                binModel: 'RecyclingCenter',
                lgu: lguId,
                assignedCollector: collectorId,
                status: 'completed',
                requestType: 'manual',
                collectedWaste: [
                    { category: 'Keyboard', quantity: 15, unit: 'items' },
                    { category: 'Smartphone', quantity: 18, unit: 'items' },
                    { category: 'Laptop', quantity: 5, unit: 'items' }
                ],
                completionDate: monthsAgo(0, -2),
                createdAt: monthsAgo(0, -4),
                notes: MOCK_TAG
            }
        ];

        // 5. MOCK BIN DROPOFFS (Smart Bin resident deposits)
        const mockDropoffs = [
            // 2 Months Ago
            { binId, wasteType: 'Smartphone', kilograms: 1.08, quantity: 6, pointsAwarded: 60, status: 'approved', createdAt: monthsAgo(2, -4), notes: MOCK_TAG },
            { binId, wasteType: 'Batteries', kilograms: 1.50, quantity: 30, pointsAwarded: 30, status: 'approved', createdAt: monthsAgo(2, 3), notes: MOCK_TAG },
            { binId, wasteType: 'Cables & Chargers', kilograms: 1.50, quantity: 10, pointsAwarded: 40, status: 'approved', createdAt: monthsAgo(2, 7), notes: MOCK_TAG },

            // 1 Month Ago
            { binId, wasteType: 'Laptop', kilograms: 6.00, quantity: 3, pointsAwarded: 300, status: 'approved', createdAt: monthsAgo(1, -5), notes: MOCK_TAG },
            { binId, wasteType: 'Smartphone', kilograms: 2.70, quantity: 15, pointsAwarded: 150, status: 'approved', createdAt: monthsAgo(1, 0), notes: MOCK_TAG },
            { binId, wasteType: 'Keyboard', kilograms: 3.00, quantity: 5, pointsAwarded: 100, status: 'approved', createdAt: monthsAgo(1, 4), notes: MOCK_TAG },
            { binId, wasteType: 'Batteries', kilograms: 2.50, quantity: 50, pointsAwarded: 50, status: 'approved', createdAt: monthsAgo(1, 9), notes: MOCK_TAG },

            // Current Month
            { binId, wasteType: 'Laptop', kilograms: 8.00, quantity: 4, pointsAwarded: 400, status: 'approved', createdAt: monthsAgo(0, -8), notes: MOCK_TAG },
            { binId, wasteType: 'Smartphone', kilograms: 4.50, quantity: 25, pointsAwarded: 250, status: 'approved', createdAt: monthsAgo(0, -5), notes: MOCK_TAG },
            { binId, wasteType: 'Keyboard', kilograms: 4.80, quantity: 8, pointsAwarded: 160, status: 'approved', createdAt: monthsAgo(0, -3), notes: MOCK_TAG },
            { binId, wasteType: 'Cables & Chargers', kilograms: 3.75, quantity: 25, pointsAwarded: 125, status: 'approved', createdAt: monthsAgo(0, -1), notes: MOCK_TAG }
        ];

        // 6. INSERT TO DATABASE
        await Request.insertMany(mockRequests);
        await BinDropoff.insertMany(mockDropoffs);

        console.log('\n======================================================');
        console.log('🎉 SEEDING COMPLETED WITH ASSIGNED COLLECTORS!');
        console.log('======================================================');
        console.log(`📦 Inserted Requests : ${mockRequests.length} completed hauling requests (All Assigned)`);
        console.log(`🗑️ Inserted Drop-offs: ${mockDropoffs.length} smart bin drop-offs`);
        console.log(`🚚 Assigned Collector: ${sampleCollector.firstName} ${sampleCollector.lastName} (${sampleCollector.vehiclePlate})`);
        console.log('📋 5 Clean Categories : Laptop, Smartphone, Batteries, Keyboard, Cables & Chargers');
        console.log('\n🚀 Paano i-verify:');
        console.log('   - Sa Recent Activity Tables at Reports, makikita mong may pangalan na ang collector sa halip na "Unassigned".');
        console.log('\n🧹 Para burahin pagkatapos ng defense:');
        console.log('   node recytechbackend/seedAnalytics.js --clean');
        console.log('======================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
}

runSeed();
