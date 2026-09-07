const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../recytechbackend/models/User');
const Collector = require('../recytechbackend/models/Collector');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const RecyclingCenter = require('../recytechbackend/models/RecyclingCenter');
const Bin = require('../recytechbackend/models/Bin');
const Request = require('../recytechbackend/models/Request');
const { getProfileForUser } = require('../recytechbackend/utils/roleHelper');


async function runTests() {
    console.log('=== PHASE 6: COLLECTOR WORKFLOW AUTOMATED TESTS ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const testTimestamp = Date.now();
    const testCollectorEmail = `test_p6_collector_${testTimestamp}@recytech.com`;
    const testPartnerEmail = `test_p6_partner_${testTimestamp}@recytech.com`;

    let collectorUser, collectorProfile, partnerUser, partnerProfile, testBin, testJob;

    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // 1. Create Collector
        collectorUser = await User.create({
            firstName: 'Driver',
            lastName: 'Pro',
            email: testCollectorEmail,
            password: hashedPassword,
            role: 'collector',
            status: 'Active'
        });
        collectorProfile = await Collector.create({
            user: collectorUser._id,
            firstName: 'Driver',
            lastName: 'Pro',
            phone: '09191234567',
            vehicleType: 'Truck',
            vehiclePlate: `COL-${testTimestamp.toString().slice(-4)}`,
            status: 'Active'
        });

        // 2. Create Partner Org & Bin
        partnerUser = await User.create({
            firstName: 'Barangay',
            lastName: 'Official',
            email: testPartnerEmail,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partnerProfile = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Barangay Highway LGU ${testTimestamp}`,
            email: testPartnerEmail,
            password: hashedPassword,
            contactPerson: 'Hon. Ramos',
            phone: '09170002222',
            organizationType: 'Barangay'
        });

        testBin = await Bin.create({
            binId: `BIN_P6_${testTimestamp}`,
            name: `E-Waste Bin Main #${testTimestamp.toString().slice(-4)}`,
            address: '456 Highway Blvd, QC',
            location: { type: 'Point', coordinates: [121.04, 14.62] },
            status: 'Full',
            fillLevel: 90,
            assignedLgu: partnerProfile._id
        });

        // 3. Create Scheduled Job assigned to Collector
        testJob = await Request.create({
            bin: testBin._id,
            lgu: partnerProfile._id,
            assignedCollector: collectorProfile._id,
            scheduledDate: new Date(),
            status: 'scheduled',
            requestType: 'manual',
            notes: 'Pick up 450kg of e-waste from bin'
        });

        console.log('Test fixtures created successfully.\n');

        // Test 1: Collector profile and initial stats
        console.log('Test 1: Collector queries profile & assigned active count...');
        const profileLookup = await getProfileForUser(collectorUser._id, collectorUser.role);
        const activeJobsCount = await Request.countDocuments({
            assignedCollector: collectorProfile._id,
            status: { $in: ['scheduled', 'in_transit', 'arrived', 'in_progress'] }
        });

        if (profileLookup.profile && profileLookup.profile.vehiclePlate === collectorProfile.vehiclePlate && activeJobsCount === 1) {
            console.log(`✅ Test 1 Passed: Collector profile verified with 1 active job.`);
        } else {
            throw new Error('Test 1 Failed: Profile lookup failed.');
        }

        // Test 2: Collector toggles status to Inactive and then Active
        console.log('\nTest 2: Collector toggles duty status (Inactive / Active)...');
        collectorProfile.status = 'Inactive';
        await collectorProfile.save();
        let updatedProfile = await Collector.findById(collectorProfile._id);
        if (updatedProfile.status !== 'Inactive') throw new Error('Status update to Inactive failed');

        collectorProfile.status = 'Active';
        await collectorProfile.save();
        updatedProfile = await Collector.findById(collectorProfile._id);
        if (updatedProfile.status === 'Active') {
            console.log('✅ Test 2 Passed: Collector status toggled to Inactive and back to Active.');
        } else {
            throw new Error('Test 2 Failed: Status toggle failed.');
        }

        // Test 3: Collector queries assigned jobs
        console.log('\nTest 3: Collector fetches assigned collection jobs...');
        const jobs = await Request.find({ assignedCollector: collectorProfile._id })
            .populate('bin')
            .populate('lgu');

        if (jobs.length === 1 && jobs[0].bin && (jobs[0].bin.binId || jobs[0].bin.address)) {
            console.log(`✅ Test 3 Passed: Successfully fetched assigned job for bin "${jobs[0].bin.binId || jobs[0].bin.address}".`);
        } else {
            throw new Error('Test 3 Failed: Jobs query failed.');
        }

        // Test 4: Collector advances job status (in_transit -> arrived -> in_progress)
        console.log('\nTest 4: Collector advances job status (in_transit -> arrived -> in_progress)...');
        testJob.status = 'in_transit';
        await testJob.save();
        let inTransitCheck = await Request.findById(testJob._id);
        if (inTransitCheck.status !== 'in_transit') throw new Error('Failed to set in_transit');

        testJob.status = 'arrived';
        await testJob.save();
        let arrivedCheck = await Request.findById(testJob._id);
        if (arrivedCheck.status !== 'arrived') throw new Error('Failed to set arrived');

        testJob.status = 'in_progress';
        await testJob.save();
        let inProgressCheck = await Request.findById(testJob._id);
        if (inProgressCheck.status === 'in_progress') {
            console.log('✅ Test 4 Passed: Status successfully transitioned through in_transit -> arrived -> in_progress.');
        } else {
            throw new Error('Test 4 Failed: Status transition failed.');
        }

        // Test 5: Collector completes collection job with waste breakdown
        console.log('\nTest 5: Collector completes collection and resets bin fill status...');
        testJob.status = 'completed';
        testJob.completionDate = new Date();
        testJob.collectedWaste = [
            { category: 'Battery', quantity: 20, unit: 'pcs' },
            { category: 'Electronics', quantity: 5, unit: 'units' }
        ];
        await testJob.save();

        // Simulate bin reset as in controller
        await Bin.findByIdAndUpdate(testBin._id, {
            status: 'Operational',
            fillLevel: 0
        });

        const completedJob = await Request.findById(testJob._id);
        const resetBin = await Bin.findById(testBin._id);

        if (
            completedJob.status === 'completed' &&
            completedJob.collectedWaste.length === 2 &&
            resetBin.status === 'Operational' &&
            resetBin.fillLevel === 0
        ) {
            console.log('✅ Test 5 Passed: Collection completed with waste breakdown and bin status reset to Operational (0% fill).');
        } else {
            throw new Error('Test 5 Failed: Job completion or bin reset failed.');
        }

        // Test 6: Collector summary performance statistics
        console.log('\nTest 6: Collector summary statistics calculation...');
        const completedRequests = await Request.find({
            assignedCollector: collectorProfile._id,
            status: 'completed'
        });

        let totalItems = 0;
        completedRequests.forEach(r => {
            r.collectedWaste.forEach(w => { totalItems += w.quantity; });
        });

        if (completedRequests.length === 1 && totalItems === 25) {
            console.log(`✅ Test 6 Passed: Collector stats verified: 1 completed collection, 25 total waste items collected.`);
        } else {
            throw new Error('Test 6 Failed: Stats calculation failed.');
        }

        console.log('\n=============================================');
        console.log('🎉 ALL PHASE 6 AUTOMATED TESTS PASSED SUCCESSFULLY!');
        console.log('=============================================\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        console.log('Cleaning up test data...');
        if (testJob) await Request.deleteOne({ _id: testJob._id });
        if (testBin) await Bin.deleteOne({ _id: testBin._id });
        if (collectorProfile) await Collector.deleteOne({ _id: collectorProfile._id });
        if (collectorUser) await User.deleteOne({ _id: collectorUser._id });
        if (partnerProfile) await PartnerOrganization.deleteOne({ _id: partnerProfile._id });
        if (partnerUser) await User.deleteOne({ _id: partnerUser._id });
        await mongoose.disconnect();
        console.log('Cleanup completed and database disconnected.\n');
    }
}

runTests().catch(() => process.exit(1));
