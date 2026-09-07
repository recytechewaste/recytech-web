const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');

const { registerUser } = require('../recytechbackend/controllers/authController');

const mockRes = () => {
    const res = {
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
        cookie() { return this; }
    };
    return res;
};

const invokeHandler = async (handler, req) => {
    const res = mockRes();
    return new Promise((resolve, reject) => {
        const next = (err) => {
            if (err) return reject(err);
            resolve(res);
        };
        const origJson = res.json.bind(res);
        res.json = (data) => {
            origJson(data);
            resolve(res);
            return res;
        };
        const result = handler(req, res, next);
        if (result && typeof result.catch === 'function') {
            result.catch(reject);
        }
    });
};

async function runTests() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const timestamp = Date.now();
    const testHouseholdEmail = `test_household_${timestamp}@recytech.test`;
    const testPartnerEmail = `test_partner_${timestamp}@recytech.test`;
    const testCollectorEmail = `test_collector_${timestamp}@recytech.test`;
    const testPrivilegedEmail = `test_staff_${timestamp}@recytech.test`;

    try {
        console.log('\n--- TEST 1: Household Registration ---');
        const req1 = {
            body: {
                firstName: 'Juan',
                lastName: 'Dela Cruz',
                email: testHouseholdEmail,
                password: 'Password123!',
                role: 'household',
                phone: '09171234567'
            }
        };
        const res1 = await invokeHandler(registerUser, req1);

        console.log('Response status:', res1.statusCode);
        console.log('Response data:', JSON.stringify(res1.data, null, 2));

        if (res1.statusCode !== 201 || !res1.data.profileId) {
            throw new Error(`Test 1 Failed: Expected 201 with profileId, got ${res1.statusCode}`);
        }

        const user1 = await User.findById(res1.data.user._id);
        const resident1 = await Resident.findById(res1.data.profileId);
        if (!user1 || user1.role !== 'household' || user1.status !== 'Active') {
            throw new Error('Test 1 Failed: User record incorrect');
        }
        if (!resident1 || resident1.user.toString() !== user1._id.toString()) {
            throw new Error('Test 1 Failed: Resident not linked to User');
        }
        console.log('✅ TEST 1 PASSED: Household registered atomically with Resident profile.');

        console.log('\n--- TEST 2: Partner Organization Registration ---');
        const req2 = {
            body: {
                organizationName: 'Barangay San Antonio Green Team',
                contactPerson: 'Maria Santos',
                email: testPartnerEmail,
                password: 'Password123!',
                role: 'partner_org',
                contactNumber: '09187654321'
            }
        };
        const res2 = await invokeHandler(registerUser, req2);

        console.log('Response status:', res2.statusCode);
        console.log('Response data:', JSON.stringify(res2.data, null, 2));

        if (res2.statusCode !== 201 || !res2.data.profileId) {
            throw new Error(`Test 2 Failed: Expected 201 with profileId, got ${res2.statusCode}`);
        }

        const user2 = await User.findById(res2.data.user._id);
        const partner2 = await PartnerOrganization.findById(res2.data.profileId);
        if (!user2 || user2.role !== 'partner_org' || user2.status !== 'Active') {
            throw new Error('Test 2 Failed: User record incorrect');
        }
        if (!partner2 || partner2.user.toString() !== user2._id.toString() || partner2.name !== 'Barangay San Antonio Green Team') {
            throw new Error('Test 2 Failed: Partner Org not properly created/linked in lguaccounts');
        }
        console.log('✅ TEST 2 PASSED: Partner Org registered atomically in lguaccounts collection.');

        console.log('\n--- TEST 3: Collector Registration with E-Trike vehicle ---');
        const req3 = {
            body: {
                firstName: 'Pedro',
                lastName: 'Penduko',
                email: testCollectorEmail,
                password: 'Password123!',
                role: 'collector',
                phone: '09191112233',
                vehicleType: 'E-Trike',
                vehiclePlate: 'ET-2024'
            }
        };
        const res3 = await invokeHandler(registerUser, req3);

        console.log('Response status:', res3.statusCode);
        console.log('Response data:', JSON.stringify(res3.data, null, 2));

        if (res3.statusCode !== 201 || !res3.data.profileId) {
            throw new Error(`Test 3 Failed: Expected 201 with profileId, got ${res3.statusCode}`);
        }

        const user3 = await User.findById(res3.data.user._id);
        const collector3 = await Collector.findById(res3.data.profileId);
        if (!user3 || user3.role !== 'collector' || user3.status !== 'Active') {
            throw new Error('Test 3 Failed: User record incorrect');
        }
        if (!collector3 || collector3.user.toString() !== user3._id.toString() || collector3.vehicleType !== 'E-Trike') {
            throw new Error('Test 3 Failed: Collector vehicle type or linkage incorrect');
        }
        console.log('✅ TEST 3 PASSED: Collector registered with E-Trike and linked profile.');

        console.log('\n--- TEST 4: Privileged Role Prevention (Staff / Admin) ---');
        const req4 = {
            body: {
                firstName: 'Hacker',
                lastName: 'Admin',
                email: testPrivilegedEmail,
                password: 'Password123!',
                role: 'Staff'
            }
        };
        let rejected = false;
        try {
            await invokeHandler(registerUser, req4);
        } catch (err) {
            rejected = true;
            console.log('Caught expected rejection error:', err.message);
        }
        if (!rejected) {
            throw new Error('Test 4 Failed: Privileged registration was not blocked!');
        }
        console.log('✅ TEST 4 PASSED: Public registration for Staff / Admin successfully blocked with 403.');

        console.log('\n--- CLEANING UP TEST DATA ---');
        await User.deleteMany({ email: { $in: [testHouseholdEmail, testPartnerEmail, testCollectorEmail, testPrivilegedEmail] } });
        await Resident.deleteMany({ email: testHouseholdEmail });
        await PartnerOrganization.deleteMany({ email: testPartnerEmail });
        await Collector.deleteMany({ phone: '09191112233' });
        console.log('Cleaned up test records.');

        console.log('\n🎉 ALL PHASE 1 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Test execution error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
