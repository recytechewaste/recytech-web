const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');

const { registerUser, loginUser, getMe, logoutUser } = require('../recytechbackend/controllers/authController');
const { protect } = require('../recytechbackend/middleware/authMiddleware');

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

async function runPhase2Tests() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const timestamp = Date.now();
    const testHouseholdEmail = `phase2_household_${timestamp}@recytech.test`;
    const testPartnerEmail = `phase2_partner_${timestamp}@recytech.test`;
    const testCollectorEmail = `phase2_collector_${timestamp}@recytech.test`;
    const password = 'Password123!';

    try {
        console.log('\n--- SETUP: Creating Test Accounts ---');
        // 1. Household
        const reg1 = await invokeHandler(registerUser, {
            body: { firstName: 'Household', lastName: 'Tester', email: testHouseholdEmail, password, role: 'household', phone: '09170001111' }
        });
        const householdProfileId = reg1.data.profileId;

        // 2. Partner Org
        const reg2 = await invokeHandler(registerUser, {
            body: { organizationName: 'Test Org', contactPerson: 'Org Leader', email: testPartnerEmail, password, role: 'partner_org', contactNumber: '09180002222' }
        });
        const partnerProfileId = reg2.data.profileId;

        // 3. Collector
        const reg3 = await invokeHandler(registerUser, {
            body: { firstName: 'Collector', lastName: 'Driver', email: testCollectorEmail, password, role: 'collector', phone: '09190003333', vehicleType: 'E-Trike' }
        });
        const collectorProfileId = reg3.data.profileId;

        console.log('Accounts provisioned.');

        console.log('\n--- TEST 1: Household Login ---');
        const loginRes1 = await invokeHandler(loginUser, {
            body: { email: testHouseholdEmail, password }
        });
        console.log('Login status:', loginRes1.statusCode);
        console.log('Login envelope:', JSON.stringify(loginRes1.data, null, 2));

        if (!loginRes1.data.token || loginRes1.data.role !== 'household' || loginRes1.data.profileId.toString() !== householdProfileId.toString()) {
            throw new Error('Test 1 Failed: Household login did not return expected token, role, or linked profileId');
        }
        console.log('✅ TEST 1 PASSED: Household login returns unified envelope with profileId.');

        console.log('\n--- TEST 2: Partner Organization Login ---');
        const loginRes2 = await invokeHandler(loginUser, {
            body: { email: testPartnerEmail, password }
        });
        if (!loginRes2.data.token || loginRes2.data.role !== 'partner_org' || loginRes2.data.profileId.toString() !== partnerProfileId.toString()) {
            throw new Error('Test 2 Failed: Partner Org login did not return expected token, role, or linked profileId');
        }
        console.log('✅ TEST 2 PASSED: Partner Org login returns token with lguaccounts profileId.');

        console.log('\n--- TEST 3: Collector Login ---');
        const loginRes3 = await invokeHandler(loginUser, {
            body: { email: testCollectorEmail, password }
        });
        if (!loginRes3.data.token || loginRes3.data.role !== 'collector' || loginRes3.data.profileId.toString() !== collectorProfileId.toString()) {
            throw new Error('Test 3 Failed: Collector login did not return expected token, role, or linked profileId');
        }
        console.log('✅ TEST 3 PASSED: Collector login returns token with collector profileId.');

        console.log('\n--- TEST 4: GET /api/auth/me (Session Restore) ---');
        const token = loginRes1.data.token;
        const meReq = {
            headers: { authorization: `Bearer ${token}` }
        };

        // Run protect middleware first
        await invokeHandler(protect, meReq);
        // Then run getMe controller
        const meRes = await invokeHandler(getMe, meReq);

        console.log('/auth/me response:', JSON.stringify(meRes.data, null, 2));
        if (meRes.data.role !== 'household' || meRes.data.profileType !== 'Resident' || !meRes.data.profile) {
            throw new Error('Test 4 Failed: /api/auth/me failed to restore session and populate profile.');
        }
        console.log('✅ TEST 4 PASSED: /api/auth/me successfully restored user session and profile.');

        console.log('\n--- TEST 5: Status Revalidation (Inactive Account Block) ---');
        // Deactivate household user
        await User.findOneAndUpdate({ email: testHouseholdEmail }, { status: 'Inactive' });

        // A. Login should be blocked
        let loginBlocked = false;
        try {
            await invokeHandler(loginUser, { body: { email: testHouseholdEmail, password } });
        } catch (err) {
            loginBlocked = true;
            console.log('Caught login block for inactive user:', err.message);
        }
        if (!loginBlocked) throw new Error('Test 5 Failed: Deactivated user was allowed to login!');

        // B. Existing JWT token access should be blocked by protect middleware
        const blockedReq = { headers: { authorization: `Bearer ${token}` } };
        const blockRes = await invokeHandler(protect, blockedReq);
        console.log('Middleware block status:', blockRes.statusCode, blockRes.data);
        if (blockRes.statusCode !== 403) {
            throw new Error('Test 5 Failed: Protected middleware did not reject inactive account with 403!');
        }
        console.log('✅ TEST 5 PASSED: Inactive account blocked at login and across protected middleware.');

        console.log('\n--- TEST 6: POST /api/auth/logout ---');
        const logoutRes = await invokeHandler(logoutUser, {});
        if (logoutRes.statusCode !== 200) {
            throw new Error('Test 6 Failed: Logout did not return 200 OK');
        }
        console.log('✅ TEST 6 PASSED: Stateless logout returns 200 OK.');

        console.log('\n--- CLEANING UP TEST DATA ---');
        await User.deleteMany({ email: { $in: [testHouseholdEmail, testPartnerEmail, testCollectorEmail] } });
        await Resident.deleteMany({ email: testHouseholdEmail });
        await PartnerOrganization.deleteMany({ email: testPartnerEmail });
        await Collector.deleteMany({ phone: '09190003333' });
        console.log('Cleaned up test records.');

        console.log('\n🎉 ALL PHASE 2 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Test execution error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runPhase2Tests();
