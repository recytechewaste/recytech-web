const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');
const Bin = require('../recytechbackend/models/Bin');
const Request = require('../recytechbackend/models/Request');
const Transaction = require('../recytechbackend/models/Transaction');

async function runTests() {
    console.log('=== PHASE 4: SHARED REQUESTS & TRANSACTIONS AUTOMATED TESTS ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const testTimestamp = Date.now();
    const testAdminEmail = `test_admin_${testTimestamp}@recytech.com`;
    const testPartnerEmail = `test_partner_${testTimestamp}@recytech.com`;
    const testCollectorEmail = `test_collector_${testTimestamp}@recytech.com`;
    const testResidentEmail = `test_resident_${testTimestamp}@recytech.com`;
    const testBinCode = `TEST_BIN_${testTimestamp}`;

    let adminUser, partnerUser, partnerProfile, collectorUser, collectorProfile, residentUser, residentProfile, testBin, testRequest;

    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // 1. Create Admin
        adminUser = await User.create({
            firstName: 'TestAdmin',
            lastName: 'User',
            email: testAdminEmail,
            password: hashedPassword,
            role: 'Admin',
            status: 'Active'
        });

        // 2. Create Partner Org
        partnerUser = await User.create({
            firstName: 'TestPartner',
            lastName: 'Org',
            email: testPartnerEmail,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partnerProfile = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Test Partner Org ${testTimestamp}`,
            email: testPartnerEmail,
            password: hashedPassword,
            contactPerson: 'Partner Rep',
            phone: '09123456789',
            organizationType: 'Barangay'
        });

        // 3. Create Collector
        collectorUser = await User.create({
            firstName: 'TestCollector',
            lastName: 'Driver',
            email: testCollectorEmail,
            password: hashedPassword,
            role: 'collector',
            status: 'Active'
        });
        collectorProfile = await Collector.create({
            user: collectorUser._id,
            firstName: 'TestCollector',
            lastName: 'Driver',
            email: testCollectorEmail,
            password: hashedPassword,
            phone: '09187654321',
            vehicleType: 'Truck',
            vehiclePlate: `PLT-${testTimestamp.toString().slice(-4)}`
        });

        // 4. Create Resident
        residentUser = await User.create({
            firstName: 'TestResident',
            lastName: 'Citizen',
            email: testResidentEmail,
            password: hashedPassword,
            role: 'household',
            status: 'Active'
        });
        residentProfile = await Resident.create({
            user: residentUser._id,
            firstName: 'TestResident',
            lastName: 'Citizen',
            email: testResidentEmail,
            pointsBalance: 50,
            totalPoints: 100
        });

        // 5. Create Bin assigned to Partner Org
        testBin = await Bin.create({
            binId: testBinCode,
            name: `Test Bin ${testBinCode}`,
            address: '123 Test Street, Barangay Central',
            location: { type: 'Point', coordinates: [121.0, 14.5] },
            status: 'Operational',
            assignedLgu: partnerProfile._id
        });

        console.log('Test fixtures created successfully.\n');

        // Test 1: Partner Org creates collection request
        console.log('Test 1: Partner Organization creates collection request...');
        const { getProfileForUser } = require('../recytechbackend/utils/roleHelper');
        const partnerProfileLookup = await getProfileForUser(partnerUser._id, partnerUser.role);
        
        testRequest = await Request.create({
            bin: testBin._id,
            lgu: partnerProfileLookup.profileId,
            requestType: 'manual',
            status: 'pending',
            notes: 'Bin is almost full'
        });

        if (testRequest && testRequest.status === 'pending') {
            console.log('✅ Test 1 Passed: Request created with status "pending".');
        } else {
            throw new Error('Test 1 Failed: Request creation failed.');
        }

        // Test 2: Active duplicate request check
        console.log('\nTest 2: Duplicate active request check for same bin...');
        const activeStatuses = ['pending', 'scheduled', 'assigned', 'in_progress', 'in_transit', 'arrived'];
        const existingActive = await Request.findOne({
            bin: testBin._id,
            status: { $in: activeStatuses }
        });

        if (existingActive) {
            console.log('✅ Test 2 Passed: Duplicate active request correctly identified.');
        } else {
            throw new Error('Test 2 Failed: Did not detect existing active request.');
        }

        // Test 3: Admin schedules and assigns Collector
        console.log('\nTest 3: Admin schedules request and assigns Collector...');
        testRequest.status = 'scheduled';
        testRequest.assignedCollector = collectorProfile._id;
        testRequest.scheduledDate = new Date();
        await testRequest.save();

        const updatedAfterSchedule = await Request.findById(testRequest._id)
            .populate('assignedCollector')
            .populate('lgu');

        if (
            updatedAfterSchedule.status === 'scheduled' &&
            updatedAfterSchedule.assignedCollector._id.toString() === collectorProfile._id.toString()
        ) {
            console.log('✅ Test 3 Passed: Request scheduled and collector assigned.');
        } else {
            throw new Error('Test 3 Failed: Request schedule update failed.');
        }

        // Test 4: Collector advances status to in_transit
        console.log('\nTest 4: Collector advances request status to in_transit...');
        testRequest.status = 'in_transit';
        await testRequest.save();

        const updatedInTransit = await Request.findById(testRequest._id);
        if (updatedInTransit.status === 'in_transit') {
            console.log('✅ Test 4 Passed: Status updated to in_transit.');
        } else {
            throw new Error('Test 4 Failed: Status transition to in_transit failed.');
        }

        // Test 5: Collector completes request
        console.log('\nTest 5: Collector completes collection request with waste breakdown...');
        testRequest.status = 'completed';
        testRequest.completionDate = new Date();
        testRequest.collectedWaste = [
            { category: 'Battery', quantity: 10, unit: 'pcs' },
            { category: 'Electronics', quantity: 2, unit: 'units' }
        ];
        await testRequest.save();

        const updatedCompleted = await Request.findById(testRequest._id);
        if (updatedCompleted.status === 'completed' && updatedCompleted.collectedWaste.length === 2) {
            console.log('✅ Test 5 Passed: Request completed with waste breakdown.');
        } else {
            throw new Error('Test 5 Failed: Completion failed.');
        }

        // Test 6: Household transaction history retrieval
        console.log('\nTest 6: Resident creates and queries transaction history...');
        const newTransaction = await Transaction.create({
            resident: residentProfile._id,
            type: 'Payment',
            points: 25,
            requestId: testRequest._id,
            description: 'Reward points for verified drop-off'
        });

        const residentTransactions = await Transaction.find({ resident: residentProfile._id });
        if (residentTransactions.length > 0 && residentTransactions[0].points === 25) {
            console.log('✅ Test 6 Passed: Resident transaction record verified.');
        } else {
            throw new Error('Test 6 Failed: Transaction query failed.');
        }

        console.log('\n=============================================');
        console.log('🎉 ALL PHASE 4 AUTOMATED TESTS PASSED SUCCESSFULLY!');
        console.log('=============================================\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        // Cleanup test data
        console.log('Cleaning up test data...');
        if (testRequest) await Request.deleteOne({ _id: testRequest._id });
        if (testBin) await Bin.deleteOne({ _id: testBin._id });
        if (adminUser) await User.deleteOne({ _id: adminUser._id });
        if (partnerProfile) await PartnerOrganization.deleteOne({ _id: partnerProfile._id });
        if (partnerUser) await User.deleteOne({ _id: partnerUser._id });
        if (collectorProfile) await Collector.deleteOne({ _id: collectorProfile._id });
        if (collectorUser) await User.deleteOne({ _id: collectorUser._id });
        if (residentProfile) {
            await Transaction.deleteMany({ resident: residentProfile._id });
            await Resident.deleteOne({ _id: residentProfile._id });
        }
        if (residentUser) await User.deleteOne({ _id: residentUser._id });
        await mongoose.disconnect();
        console.log('Cleanup completed and database disconnected.\n');
    }
}

runTests().catch(() => process.exit(1));
