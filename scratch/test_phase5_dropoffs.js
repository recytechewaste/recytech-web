const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const RecyclingCenter = require('../recytechbackend/models/RecyclingCenter');
const RewardPoint = require('../recytechbackend/models/RewardPoint');
const BinDropoff = require('../recytechbackend/models/BinDropoff');
const Transaction = require('../recytechbackend/models/Transaction');
const { calculatePointsAwarded } = require('../recytechbackend/utils/calculatePoints');

async function runTests() {
    console.log('=== PHASE 5: BINS, QR & DROP-OFF VERIFICATION AUTOMATED TESTS ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const testTimestamp = Date.now();
    const testAdminEmail = `test_p5_admin_${testTimestamp}@recytech.com`;
    const testPartnerEmail = `test_p5_partner_${testTimestamp}@recytech.com`;
    const testResidentEmail = `test_p5_resident_${testTimestamp}@recytech.com`;
    const testQrCode = `QR_BIN_${testTimestamp}`;

    let adminUser, partnerUser, partnerProfile, residentUser, residentProfile, testBin, testRewardPoint, testDropoff1, testDropoff2;

    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // 1. Create Admin
        adminUser = await User.create({
            firstName: 'AdminP5',
            lastName: 'Tester',
            email: testAdminEmail,
            password: hashedPassword,
            role: 'Admin',
            status: 'Active'
        });

        // 2. Create Partner Org
        partnerUser = await User.create({
            firstName: 'PartnerP5',
            lastName: 'Official',
            email: testPartnerEmail,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partnerProfile = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Barangay San Antonio LGU ${testTimestamp}`,
            email: testPartnerEmail,
            password: hashedPassword,
            contactPerson: 'Capt. Juan',
            phone: '09123456789',
            organizationType: 'Barangay'
        });

        // 3. Create Resident
        residentUser = await User.create({
            firstName: 'ResidentP5',
            lastName: 'User',
            email: testResidentEmail,
            password: hashedPassword,
            role: 'household',
            status: 'Active'
        });
        residentProfile = await Resident.create({
            user: residentUser._id,
            firstName: 'ResidentP5',
            lastName: 'User',
            email: testResidentEmail,
            pointsBalance: 10,
            totalPoints: 10
        });

        // 4. Create Reward Point Rule for Category
        testRewardPoint = await RewardPoint.findOneAndUpdate(
            { wasteType: 'Battery' },
            { wasteType: 'Battery', pointsPerItem: 5, isActive: true },
            { upsert: true, new: true }
        );

        // 5. Create RecyclingCenter Bin with QR Code assigned to Partner Org
        testBin = await RecyclingCenter.create({
            name: `E-Waste Bin #${testTimestamp.toString().slice(-4)}`,
            address: 'Barangay Hall compound, San Antonio',
            location: { type: 'Point', coordinates: [121.05, 14.58] },
            qrCode: testQrCode,
            status: 'Empty',
            capacityKg: 500,
            currentFillKg: 0,
            assignedLgu: partnerProfile._id
        });

        console.log('Test fixtures initialized successfully.\n');

        // Test 1: Resolve Bin by QR Code
        console.log('Test 1: QR Code Lookup for Bin...');
        const resolvedBin = await RecyclingCenter.findOne({ qrCode: testQrCode })
            .populate('assignedLgu', 'name contactPerson email');

        if (resolvedBin && resolvedBin.assignedLgu._id.toString() === partnerProfile._id.toString()) {
            console.log(`✅ Test 1 Passed: QR code resolved to Bin "${resolvedBin.name}" assigned to "${resolvedBin.assignedLgu.name}".`);
        } else {
            throw new Error('Test 1 Failed: Bin QR lookup failed.');
        }

        // Test 2: Resident submits drop-off form with image
        console.log('\nTest 2: Resident submits drop-off submission with photo & waste details...');
        const mockImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        testDropoff1 = await BinDropoff.create({
            resident: residentProfile._id,
            binId: testBin._id,
            participantEmail: residentProfile.email,
            participantName: `${residentProfile.firstName} ${residentProfile.lastName}`,
            wasteType: 'Battery',
            quantity: 4,
            kilograms: 4,
            image: mockImageBase64,
            notes: '4 used AA lithium batteries',
            status: 'pending',
            pointsAwarded: 0,
            processed: false
        });

        if (testDropoff1 && testDropoff1.status === 'pending' && testDropoff1.image.length > 0) {
            console.log('✅ Test 2 Passed: Drop-off record created with status "pending" and e-waste image attached.');
        } else {
            throw new Error('Test 2 Failed: Drop-off creation failed.');
        }

        // Test 3: Partner Org queries pending drop-offs for their bins
        console.log('\nTest 3: Partner Org queries drop-offs for assigned bins...');
        const assignedBins = await RecyclingCenter.find({ assignedLgu: partnerProfile._id }).select('_id');
        const binIds = assignedBins.map(b => b._id);
        const partnerPendingDropoffs = await BinDropoff.find({ binId: { $in: binIds }, status: 'pending' })
            .populate('resident', 'firstName lastName email pointsBalance');

        if (partnerPendingDropoffs.length === 1 && partnerPendingDropoffs[0]._id.toString() === testDropoff1._id.toString()) {
            console.log('✅ Test 3 Passed: Partner Organization correctly retrieved pending drop-off submission.');
        } else {
            throw new Error('Test 3 Failed: Partner Org drop-off query failed.');
        }

        // Test 4: Partner Org validates & approves drop-off -> automatic points credit
        console.log('\nTest 4: Partner Org approves drop-off -> verify instant point credit & transaction...');
        const calc = await calculatePointsAwarded(testDropoff1.wasteType, testDropoff1.quantity);
        const expectedPoints = calc.points; // 4 items * 5 pts = 20 pts

        testDropoff1.status = 'approved';
        testDropoff1.pointsAwarded = expectedPoints;
        testDropoff1.validatedBy = partnerProfile._id;
        testDropoff1.validatedAt = new Date();
        testDropoff1.validationNotes = 'Verified 4 batteries by Barangay official.';
        testDropoff1.processed = true;
        await testDropoff1.save();

        // Credit Resident and log transaction
        await Resident.findByIdAndUpdate(residentProfile._id, {
            $inc: { pointsBalance: expectedPoints, totalPoints: expectedPoints }
        });

        const createdTx = await Transaction.create({
            resident: residentProfile._id,
            type: 'Payment',
            points: expectedPoints,
            dropoffId: testDropoff1._id,
            description: `Reward for verified drop-off (Battery) at ${testBin.name}`
        });

        const updatedResident = await Resident.findById(residentProfile._id);
        if (
            updatedResident.pointsBalance === 30 && // 10 initial + 20 awarded
            updatedResident.totalPoints === 30 &&
            createdTx.points === 20
        ) {
            console.log(`✅ Test 4 Passed: Drop-off approved. Resident points updated to ${updatedResident.pointsBalance} and Transaction recorded.`);
        } else {
            throw new Error(`Test 4 Failed: Point calculation/crediting failed. Balance: ${updatedResident.pointsBalance}`);
        }

        // Test 5: Rejection workflow
        console.log('\nTest 5: Partner Org rejects non-compliant drop-off submission...');
        testDropoff2 = await BinDropoff.create({
            resident: residentProfile._id,
            binId: testBin._id,
            participantEmail: residentProfile.email,
            participantName: `${residentProfile.firstName} ${residentProfile.lastName}`,
            wasteType: 'Battery',
            quantity: 2,
            image: mockImageBase64,
            notes: 'Broken item',
            status: 'pending',
            pointsAwarded: 0
        });

        testDropoff2.status = 'rejected';
        testDropoff2.pointsAwarded = 0;
        testDropoff2.validatedBy = partnerProfile._id;
        testDropoff2.validatedAt = new Date();
        testDropoff2.validationNotes = 'Item is hazardous chemical, not recyclable battery.';
        testDropoff2.processed = true;
        await testDropoff2.save();

        const residentAfterReject = await Resident.findById(residentProfile._id);
        if (
            testDropoff2.status === 'rejected' &&
            testDropoff2.pointsAwarded === 0 &&
            residentAfterReject.pointsBalance === 30 // unchanged
        ) {
            console.log('✅ Test 5 Passed: Rejection successfully processed with 0 points and unchanged resident balance.');
        } else {
            throw new Error('Test 5 Failed: Rejection flow failed.');
        }

        console.log('\n=============================================');
        console.log('🎉 ALL PHASE 5 AUTOMATED TESTS PASSED SUCCESSFULLY!');
        console.log('=============================================\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        throw err;
    } finally {
        console.log('Cleaning up test data...');
        if (testDropoff1) await BinDropoff.deleteOne({ _id: testDropoff1._id });
        if (testDropoff2) await BinDropoff.deleteOne({ _id: testDropoff2._id });
        if (testBin) await RecyclingCenter.deleteOne({ _id: testBin._id });
        if (adminUser) await User.deleteOne({ _id: adminUser._id });
        if (partnerProfile) await PartnerOrganization.deleteOne({ _id: partnerProfile._id });
        if (partnerUser) await User.deleteOne({ _id: partnerUser._id });
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
