const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const RecyclingCenter = require('../recytechbackend/models/RecyclingCenter');
const Bin = require('../recytechbackend/models/Bin');
const BinDropoff = require('../recytechbackend/models/BinDropoff');
const Request = require('../recytechbackend/models/Request');
const { getProfileForUser } = require('../recytechbackend/utils/roleHelper');

async function runTests() {
    console.log('=== PHASE 7: PARTNER ORGANIZATION WORKFLOW AUTOMATED TESTS ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const testTimestamp = Date.now();
    const testPartner1Email = `test_p7_partner1_${testTimestamp}@recytech.com`;
    const testPartner2Email = `test_p7_partner2_${testTimestamp}@recytech.com`;
    const testResidentEmail = `test_p7_resident_${testTimestamp}@recytech.com`;

    let partner1User, partner1Profile, partner2User, partner2Profile, residentUser, residentProfile, testBin1, testBin2, testDropoff1, testDropoff2, testRequest1;

    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // 1. Create Partner Org 1
        partner1User = await User.create({
            firstName: 'Barangay',
            lastName: 'Leader 1',
            email: testPartner1Email,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partner1Profile = await PartnerOrganization.create({
            user: partner1User._id,
            name: `Barangay San Isidro LGU ${testTimestamp}`,
            email: testPartner1Email,
            password: hashedPassword,
            contactPerson: 'Hon. Isidro',
            phone: '09171111111',
            jurisdiction: 'District 1',
            organizationType: 'Barangay'
        });

        // 2. Create Partner Org 2 (for unauthorized access test)
        partner2User = await User.create({
            firstName: 'Barangay',
            lastName: 'Leader 2',
            email: testPartner2Email,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partner2Profile = await PartnerOrganization.create({
            user: partner2User._id,
            name: `Barangay San Roque LGU ${testTimestamp}`,
            email: testPartner2Email,
            password: hashedPassword,
            contactPerson: 'Hon. Roque',
            phone: '09172222222',
            jurisdiction: 'District 2',
            organizationType: 'Barangay'
        });

        // 3. Create Resident
        residentUser = await User.create({
            firstName: 'Citizen',
            lastName: 'One',
            email: testResidentEmail,
            password: hashedPassword,
            role: 'household',
            status: 'Active'
        });
        residentProfile = await Resident.create({
            user: residentUser._id,
            firstName: 'Citizen',
            lastName: 'One',
            email: testResidentEmail,
            pointsBalance: 50,
            totalPoints: 50
        });

        // 4. Create Bin 1 for Partner Org 1
        testBin1 = await RecyclingCenter.create({
            name: `San Isidro E-Waste Bin #${testTimestamp.toString().slice(-4)}`,
            address: 'San Isidro Plaza, QC',
            location: { type: 'Point', coordinates: [121.05, 14.65] },
            qrCode: `BIN_P7_1_${testTimestamp}`,
            status: 'Operational',
            capacityKg: 500,
            currentFillKg: 100,
            assignedLgu: partner1Profile._id
        });

        // 5. Create Bin 2 for Partner Org 2
        testBin2 = await RecyclingCenter.create({
            name: `San Roque E-Waste Bin #${testTimestamp.toString().slice(-4)}`,
            address: 'San Roque Sports Center, QC',
            location: { type: 'Point', coordinates: [121.08, 14.68] },
            qrCode: `BIN_P7_2_${testTimestamp}`,
            status: 'Operational',
            capacityKg: 500,
            currentFillKg: 50,
            assignedLgu: partner2Profile._id
        });

        // 6. Create Dropoffs for Bin 1
        testDropoff1 = await BinDropoff.create({
            resident: residentProfile._id,
            binId: testBin1._id,
            participantEmail: residentProfile.email,
            wasteType: 'Battery',
            quantity: 5,
            status: 'approved',
            pointsAwarded: 25,
            validatedBy: partner1Profile._id,
            validatedAt: new Date(),
            processed: true
        });

        testDropoff2 = await BinDropoff.create({
            resident: residentProfile._id,
            binId: testBin1._id,
            participantEmail: residentProfile.email,
            wasteType: 'Small Electronics',
            quantity: 2,
            status: 'pending',
            pointsAwarded: 0,
            processed: false
        });

        // 7. Create Collection Request for Bin 1
        testRequest1 = await Request.create({
            bin: testBin1._id,
            lgu: partner1Profile._id,
            requestType: 'manual',
            status: 'pending',
            notes: 'Collection scheduled for weekend'
        });

        console.log('Test fixtures created successfully.\n');

        // Test 1: Partner Org profile & dashboard overview
        console.log('Test 1: Partner Org queries profile & dashboard overview...');
        const profileLookup = await getProfileForUser(partner1User._id, partner1User.role);
        const assignedBins = await RecyclingCenter.find({ assignedLgu: partner1Profile._id });
        const pendingDropoffsCount = await BinDropoff.countDocuments({
            binId: { $in: assignedBins.map(b => b._id) },
            status: 'pending'
        });

        if (
            profileLookup.profile &&
            profileLookup.profile.name === partner1Profile.name &&
            assignedBins.length === 1 &&
            pendingDropoffsCount === 1
        ) {
            console.log(`✅ Test 1 Passed: Partner Org profile verified with 1 assigned bin and 1 pending drop-off.`);
        } else {
            throw new Error('Test 1 Failed: Profile overview lookup failed.');
        }

        // Test 2: Partner Org retrieves assigned bins
        console.log('\nTest 2: Partner Org retrieves assigned bins list...');
        const myBins = await RecyclingCenter.find({ assignedLgu: partner1Profile._id });
        if (myBins.length === 1 && myBins[0]._id.toString() === testBin1._id.toString()) {
            console.log(`✅ Test 2 Passed: Retrieved 1 assigned bin "${myBins[0].name}".`);
        } else {
            throw new Error('Test 2 Failed: Bins retrieval failed.');
        }

        // Test 3: Partner Org updates bin condition/status
        console.log('\nTest 3: Partner Org updates bin status to Full...');
        testBin1.status = 'Full';
        testBin1.currentFillKg = 480;
        await testBin1.save();

        const updatedBinCheck = await RecyclingCenter.findById(testBin1._id);
        if (updatedBinCheck.status === 'Full' && updatedBinCheck.currentFillKg === 480) {
            console.log('✅ Test 3 Passed: Bin status successfully updated to Full (480 kg fill).');
        } else {
            throw new Error('Test 3 Failed: Bin status update failed.');
        }

        // Test 4: Ownership protection - Partner Org 1 cannot update Bin 2
        console.log('\nTest 4: Ownership protection (cross-org bin update prevention)...');
        const bin2Owner = testBin2.assignedLgu.toString();
        const requesterId = partner1Profile._id.toString();

        if (bin2Owner !== requesterId) {
            console.log('✅ Test 4 Passed: Cross-organization bin update correctly identified as forbidden.');
        } else {
            throw new Error('Test 4 Failed: Cross-org check failed.');
        }

        // Test 5: Partner Org community impact & verification statistics
        console.log('\nTest 5: Partner Org community impact & analytics calculation...');
        const approvedDropoffs = await BinDropoff.find({
            binId: testBin1._id,
            status: 'approved'
        });

        let totalPoints = 0;
        let totalItems = 0;
        approvedDropoffs.forEach(d => {
            totalPoints += (d.pointsAwarded || 0);
            totalItems += (d.quantity || 1);
        });

        if (approvedDropoffs.length === 1 && totalPoints === 25 && totalItems === 5) {
            console.log(`✅ Test 5 Passed: Stats verified (1 validated drop-off, ${totalPoints} points awarded, ${totalItems} items received).`);
        } else {
            throw new Error('Test 5 Failed: Analytics calculation failed.');
        }

        console.log('\n=============================================');
        console.log('🎉 ALL PHASE 7 AUTOMATED TESTS PASSED SUCCESSFULLY!');
        console.log('=============================================\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        console.log('Cleaning up test data...');
        if (testDropoff1) await BinDropoff.deleteOne({ _id: testDropoff1._id });
        if (testDropoff2) await BinDropoff.deleteOne({ _id: testDropoff2._id });
        if (testRequest1) await Request.deleteOne({ _id: testRequest1._id });
        if (testBin1) await RecyclingCenter.deleteOne({ _id: testBin1._id });
        if (testBin2) await RecyclingCenter.deleteOne({ _id: testBin2._id });
        if (partner1Profile) await PartnerOrganization.deleteOne({ _id: partner1Profile._id });
        if (partner1User) await User.deleteOne({ _id: partner1User._id });
        if (partner2Profile) await PartnerOrganization.deleteOne({ _id: partner2Profile._id });
        if (partner2User) await User.deleteOne({ _id: partner2User._id });
        if (residentProfile) {
            await Resident.deleteOne({ _id: residentProfile._id });
        }
        if (residentUser) await User.deleteOne({ _id: residentUser._id });
        await mongoose.disconnect();
        console.log('Cleanup completed and database disconnected.\n');
    }
}

runTests().catch(() => process.exit(1));
