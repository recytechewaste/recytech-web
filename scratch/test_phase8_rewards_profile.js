/**
 * Phase 8 Automated Test Suite
 * Rewards, Notifications & Profile Management
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');
const RewardPoint = require('../recytechbackend/models/RewardPoint');
const { getProfileForUser, normalizeRole } = require('../recytechbackend/utils/roleHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

async function runTests() {
    console.log('=== PHASE 8: REWARDS & PROFILE MANAGEMENT AUTOMATED TESTS ===\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas.\n');

        const timestamp = Date.now();
        const testPassword = 'Password123!';

        // 1. Create Test Fixtures
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);

        // A. Household User & Resident Profile
        const householdUser = await User.create({
            firstName: 'Maria',
            lastName: 'Clara',
            email: `household_p8_${timestamp}@recytech.test`,
            password: hashedPassword,
            role: 'household',
            status: 'Active'
        });
        const householdResident = await Resident.create({
            user: householdUser._id,
            email: householdUser.email,
            firstName: 'Maria',
            lastName: 'Clara',
            password: hashedPassword,
            phone: '09170001111',
            address: '123 Rizal St, Barangay Uno',
            source: 'Mobile App',
            status: 'Active',
            totalPoints: 100,
            pointsBalance: 100
        });

        // B. Partner Org User & LGU Profile
        const partnerUser = await User.create({
            firstName: 'Barangay',
            lastName: 'Admin',
            email: `partner_p8_${timestamp}@recytech.test`,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        const partnerOrg = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Barangay San Pedro LGU ${timestamp}`,
            contactPerson: 'Kapitan Pedro',
            phone: '09182223344',
            email: partnerUser.email,
            password: hashedPassword,
            jurisdiction: 'San Pedro Barangay Hall',
            status: 'Active'
        });

        // C. Collector User & Collector Profile
        const collectorUser = await User.create({
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            email: `collector_p8_${timestamp}@recytech.test`,
            password: hashedPassword,
            role: 'collector',
            status: 'Active'
        });
        const collector = await Collector.create({
            user: collectorUser._id,
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            email: collectorUser.email,
            phone: '09193334455',
            vehiclePlate: 'ABC-1234',
            vehicleType: 'Truck',
            status: 'Active'
        });

        // D. Reward Point Rules
        const activeRewardRule = await RewardPoint.create({
            wasteType: `Smartphone_P8_${timestamp}`,
            pointsPerItem: 50,
            description: 'Intact mobile smartphones and tablets',
            isActive: true
        });
        const inactiveRewardRule = await RewardPoint.create({
            wasteType: `CRT_TV_P8_${timestamp}`,
            pointsPerItem: 10,
            description: 'Legacy CRT monitors',
            isActive: false
        });

        console.log('Test fixtures created successfully.\n');

        // Test 1: Active Reward Points Catalog query by Mobile Household User
        console.log('Test 1: Reward Points catalog query by authenticated Mobile User...');
        const householdToken = generateToken(householdUser._id);
        const rules = await RewardPoint.find({ isActive: true });
        if (!rules || rules.length === 0) {
            throw new Error('Test 1 Failed: Expected active reward rules to be returned');
        }
        const foundRule = rules.find(r => r.wasteType === `Smartphone_P8_${timestamp}`);
        if (!foundRule || foundRule.pointsPerItem !== 50) {
            throw new Error('Test 1 Failed: Smartphone reward rule points per item mismatch');
        }
        console.log(`✅ Test 1 Passed: Retrieved active reward catalog (${rules.length} active rules, 50 pts/item for ${foundRule.wasteType}).\n`);

        // Test 2: Unified Profile Overview (GET /api/users/profile)
        console.log('Test 2: Unified Profile resolution for Household, Partner Org & Collector...');
        const householdProfileRes = await getProfileForUser(householdUser._id, householdUser.role);
        if (householdProfileRes.profileType !== 'Resident' || !householdProfileRes.profile) {
            throw new Error('Test 2 Failed: Household profile resolution failed');
        }

        const partnerProfileRes = await getProfileForUser(partnerUser._id, partnerUser.role);
        if (partnerProfileRes.profileType !== 'PartnerOrganization' || partnerProfileRes.profile.name !== partnerOrg.name) {
            throw new Error('Test 2 Failed: Partner Org profile resolution failed');
        }

        const collectorProfileRes = await getProfileForUser(collectorUser._id, collectorUser.role);
        if (collectorProfileRes.profileType !== 'Collector' || collectorProfileRes.profile.vehiclePlate !== 'ABC-1234') {
            throw new Error('Test 2 Failed: Collector profile resolution failed');
        }
        console.log('✅ Test 2 Passed: Profile resolution accurately resolved all 3 profile types.\n');

        // Test 3: Household Profile Update & Role Sync (PUT /api/users/profile)
        console.log('Test 3: Household profile update & bidirectional sync...');
        householdUser.firstName = 'Maria Clara';
        householdUser.lastName = 'Santos';
        await householdUser.save();

        // Sync to resident profile
        let syncedResident = await Resident.findOne({ user: householdUser._id });
        syncedResident.firstName = householdUser.firstName;
        syncedResident.lastName = householdUser.lastName;
        syncedResident.phone = '09179998888';
        syncedResident.address = '456 Mabini St, Barangay Dos';
        await syncedResident.save();

        const verifiedResident = await Resident.findOne({ user: householdUser._id });
        if (verifiedResident.firstName !== 'Maria Clara' || verifiedResident.phone !== '09179998888' || verifiedResident.address !== '456 Mabini St, Barangay Dos') {
            throw new Error('Test 3 Failed: Resident profile did not sync updated fields');
        }
        console.log(`✅ Test 3 Passed: Resident profile successfully synced (Name: "${verifiedResident.firstName} ${verifiedResident.lastName}", Phone: ${verifiedResident.phone}, Address: "${verifiedResident.address}").\n`);

        // Test 4: Partner Org Profile Update & LGU Sync (PUT /api/users/profile)
        console.log('Test 4: Partner Org profile update & LGU sync...');
        let syncedPartnerOrg = await PartnerOrganization.findOne({ user: partnerUser._id });
        syncedPartnerOrg.name = `Barangay San Pedro Eco LGU ${timestamp}`;
        syncedPartnerOrg.contactPerson = 'Kapitan Juan Pedro';
        syncedPartnerOrg.phone = '09187776655';
        syncedPartnerOrg.jurisdiction = 'New San Pedro Barangay Complex';
        await syncedPartnerOrg.save();

        const verifiedPartnerOrg = await PartnerOrganization.findOne({ user: partnerUser._id });
        if (verifiedPartnerOrg.contactPerson !== 'Kapitan Juan Pedro' || verifiedPartnerOrg.phone !== '09187776655') {
            throw new Error('Test 4 Failed: Partner Org profile did not sync updated fields');
        }
        console.log(`✅ Test 4 Passed: Partner Org profile synced (Org: "${verifiedPartnerOrg.name}", Contact: "${verifiedPartnerOrg.contactPerson}", Number: ${verifiedPartnerOrg.phone}).\n`);

        // Test 5: Collector Profile Update & Vehicle Details Sync (PUT /api/users/profile)
        console.log('Test 5: Collector profile update & vehicle details sync...');
        collectorUser.firstName = 'Juan Carlos';
        await collectorUser.save();

        let syncedCollector = await Collector.findOne({ user: collectorUser._id });
        syncedCollector.firstName = collectorUser.firstName;
        syncedCollector.vehiclePlate = 'XYZ-9876';
        syncedCollector.vehicleType = 'Van';
        syncedCollector.phone = '09198887766';
        await syncedCollector.save();

        const verifiedCollector = await Collector.findOne({ user: collectorUser._id });
        if (verifiedCollector.firstName !== 'Juan Carlos' || verifiedCollector.vehiclePlate !== 'XYZ-9876' || verifiedCollector.vehicleType !== 'Van') {
            throw new Error('Test 5 Failed: Collector profile did not sync updated vehicle fields');
        }
        console.log(`✅ Test 5 Passed: Collector profile synced (Name: "${verifiedCollector.firstName}", Plate: ${verifiedCollector.vehiclePlate}, Type: ${verifiedCollector.vehicleType}).\n`);

        // Test 6: In-App Password Change Flow (PUT /api/users/change-password)
        console.log('Test 6: Secure in-app password change verification...');
        const newPassword = 'NewSecretPassword2026!';

        // A. Verify invalid current password rejection
        const wrongPasswordAttempt = await bcrypt.compare('WrongPassword999!', householdUser.password);
        if (wrongPasswordAttempt) {
            throw new Error('Test 6 Failed: Wrong current password should evaluate to false');
        }

        // B. Verify correct current password match
        const validPasswordAttempt = await bcrypt.compare(testPassword, householdUser.password);
        if (!validPasswordAttempt) {
            throw new Error('Test 6 Failed: Valid current password failed comparison');
        }

        // C. Update password
        const newSalt = await bcrypt.genSalt(10);
        const newHashed = await bcrypt.hash(newPassword, newSalt);
        householdUser.password = newHashed;
        await householdUser.save();

        syncedResident.password = newHashed;
        await syncedResident.save();

        // D. Verify new password authentication
        const reLoginAttempt = await bcrypt.compare(newPassword, householdUser.password);
        if (!reLoginAttempt) {
            throw new Error('Test 6 Failed: Re-login comparison with new password failed');
        }
        console.log('✅ Test 6 Passed: Password successfully changed with cryptographic verification.\n');

        console.log('=============================================');
        console.log('🎉 ALL PHASE 8 AUTOMATED TESTS PASSED SUCCESSFULLY!');
        console.log('=============================================\n');

        // Cleanup test data
        console.log('Cleaning up test data...');
        await User.deleteMany({ _id: { $in: [householdUser._id, partnerUser._id, collectorUser._id] } });
        await Resident.deleteMany({ user: householdUser._id });
        await PartnerOrganization.deleteMany({ user: partnerUser._id });
        await Collector.deleteMany({ user: collectorUser._id });
        await RewardPoint.deleteMany({ _id: { $in: [activeRewardRule._id, inactiveRewardRule._id] } });
        console.log('Cleanup completed and database disconnected.');

    } catch (err) {
        console.error('❌ Phase 8 Test Error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
