const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');

const { loginUser, getMe } = require('../recytechbackend/controllers/authController');
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

async function runHotfixTests() {
    console.log('=== RUNNING TARGETED AUTH CONTRACT HOTFIX VALIDATION ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const timestamp = Date.now();
    const householdEmail = `hotfix_house_${timestamp}@recytech.test`;
    const partnerEmail = `hotfix_part_${timestamp}@recytech.test`;
    const collectorEmail = `hotfix_coll_${timestamp}@recytech.test`;
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    let houseUser, partUser, collUser, houseProfile, partProfile, collProfile;

    try {
        // 1. Setup Household
        houseUser = await User.create({
            firstName: 'Maria',
            lastName: 'Santos',
            email: householdEmail,
            password: hashedPassword,
            role: 'household',
            status: 'Active'
        });
        houseProfile = await Resident.create({
            user: houseUser._id,
            email: householdEmail,
            firstName: 'Maria',
            lastName: 'Santos',
            status: 'Active'
        });

        // 2. Setup Partner Org
        partUser = await User.create({
            firstName: 'Barangay',
            lastName: 'Central',
            email: partnerEmail,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partProfile = await PartnerOrganization.create({
            user: partUser._id,
            name: 'Barangay Central LGU',
            contactPerson: 'Hon. Central',
            email: partnerEmail,
            password: hashedPassword,
            status: 'Active'
        });

        // 3. Setup Collector
        collUser = await User.create({
            firstName: 'Mario',
            lastName: 'Driver',
            email: collectorEmail,
            password: hashedPassword,
            role: 'collector',
            status: 'Active'
        });
        collProfile = await Collector.create({
            user: collUser._id,
            firstName: 'Mario',
            lastName: 'Driver',
            phone: '09171234567',
            status: 'Active'
        });

        console.log('--- TEST 1: POST /api/auth/login household includes accountStatus ---');
        const login1 = await invokeHandler(loginUser, { body: { email: householdEmail, password } });
        console.log('Household login response:', JSON.stringify(login1.data, null, 2));

        if (login1.data.accountStatus !== 'active') {
            throw new Error(`Expected login1.data.accountStatus === 'active', got: ${login1.data.accountStatus}`);
        }
        if (login1.data.status !== 'Active') {
            throw new Error(`Expected login1.data.status === 'Active', got: ${login1.data.status}`);
        }
        if (!login1.data.profileId || login1.data.profileId.toString() !== houseProfile._id.toString()) {
            throw new Error(`Expected profileId ${houseProfile._id}, got: ${login1.data.profileId}`);
        }
        if (!login1.data.token || !login1.data.user) {
            throw new Error('Missing token or user object in household login response');
        }
        console.log('✔ TEST 1 PASSED: household login includes accountStatus = "active" & status = "Active".\n');

        console.log('--- TEST 2: POST /api/auth/login partner_org includes accountStatus ---');
        const login2 = await invokeHandler(loginUser, { body: { email: partnerEmail, password } });
        console.log('Partner Org login response:', JSON.stringify(login2.data, null, 2));

        if (login2.data.accountStatus !== 'active') {
            throw new Error(`Expected login2.data.accountStatus === 'active', got: ${login2.data.accountStatus}`);
        }
        if (login2.data.status !== 'Active') {
            throw new Error(`Expected login2.data.status === 'Active', got: ${login2.data.status}`);
        }
        if (!login2.data.profileId || login2.data.profileId.toString() !== partProfile._id.toString()) {
            throw new Error(`Expected profileId ${partProfile._id}, got: ${login2.data.profileId}`);
        }
        console.log('✔ TEST 2 PASSED: partner_org login includes accountStatus = "active" & profileId.\n');

        console.log('--- TEST 3: POST /api/auth/login collector includes accountStatus ---');
        const login3 = await invokeHandler(loginUser, { body: { email: collectorEmail, password } });
        console.log('Collector login response:', JSON.stringify(login3.data, null, 2));

        if (login3.data.accountStatus !== 'active') {
            throw new Error(`Expected login3.data.accountStatus === 'active', got: ${login3.data.accountStatus}`);
        }
        if (login3.data.status !== 'Active') {
            throw new Error(`Expected login3.data.status === 'Active', got: ${login3.data.status}`);
        }
        if (!login3.data.profileId || login3.data.profileId.toString() !== collProfile._id.toString()) {
            throw new Error(`Expected profileId ${collProfile._id}, got: ${login3.data.profileId}`);
        }
        console.log('✔ TEST 3 PASSED: collector login includes accountStatus = "active" & profileId.\n');

        console.log('--- TEST 4: GET /api/auth/me includes accountStatus ---');
        const token = login1.data.token;
        const meReq = { headers: { authorization: `Bearer ${token}` } };
        await invokeHandler(protect, meReq);
        const meRes = await invokeHandler(getMe, meReq);
        console.log('GET /api/auth/me response:', JSON.stringify(meRes.data, null, 2));

        if (meRes.data.accountStatus !== 'active') {
            throw new Error(`Expected meRes.data.accountStatus === 'active', got: ${meRes.data.accountStatus}`);
        }
        if (meRes.data.status !== 'Active') {
            throw new Error(`Expected meRes.data.status === 'Active', got: ${meRes.data.status}`);
        }
        if (!meRes.data.profileId || meRes.data.profileId.toString() !== houseProfile._id.toString()) {
            throw new Error(`Expected profileId in /auth/me, got: ${meRes.data.profileId}`);
        }
        if (!meRes.data.user || meRes.data.user.accountStatus !== 'active') {
            throw new Error('Expected meRes.data.user.accountStatus === "active"');
        }
        console.log('✔ TEST 4 PASSED: GET /api/auth/me includes accountStatus = "active" at root and inside user.\n');

        console.log('--- TEST 5: accountStatus normalizes Active -> active ---');
        if (login1.data.accountStatus !== 'active' || login2.data.accountStatus !== 'active' || login3.data.accountStatus !== 'active') {
            throw new Error('accountStatus was not normalized to lowercase "active"!');
        }
        console.log('✔ TEST 5 PASSED: accountStatus successfully normalized to lowercase "active" for all roles.\n');

        console.log('--- TEST 6: existing profileId/token/user fields not regressed ---');
        const requiredKeys = ['_id', 'firstName', 'lastName', 'email', 'role', 'status', 'profileId', 'accountStatus', 'token', 'user'];
        for (const key of requiredKeys) {
            if (!(key in login1.data)) {
                throw new Error(`Missing expected key "${key}" in login response!`);
            }
        }
        console.log('✔ TEST 6 PASSED: All legacy and contract fields (_id, firstName, lastName, email, role, status, profileId, accountStatus, token, user) intact.\n');

        console.log('--- TEST 7: Inactive account handling remains unchanged ---');
        await User.findByIdAndUpdate(houseUser._id, { status: 'Inactive' });
        let inactiveBlocked = false;
        try {
            await invokeHandler(loginUser, { body: { email: householdEmail, password } });
        } catch (err) {
            inactiveBlocked = true;
            console.log('✔ Inactive login blocked with expected error:', err.message);
        }
        if (!inactiveBlocked) {
            throw new Error('Inactive user was not blocked at login!');
        }

        const inactiveMeReq = { headers: { authorization: `Bearer ${token}` } };
        const protectBlock = await invokeHandler(protect, inactiveMeReq);
        if (protectBlock.statusCode !== 403) {
            throw new Error('Inactive user token was not rejected by protect middleware with 403!');
        }
        console.log('✔ TEST 7 PASSED: Inactive account blocking strictly enforced at 403 Forbidden.\n');

        console.log('====================================================');
        console.log('🎉 ALL TARGETED HOTFIX TESTS PASSED SUCCESSFULLY! 🎉');
        console.log('====================================================');

    } catch (err) {
        console.error('❌ Hotfix test failed:', err);
        process.exit(1);
    } finally {
        if (houseUser) await User.findByIdAndDelete(houseUser._id);
        if (houseProfile) await Resident.findByIdAndDelete(houseProfile._id);
        if (partUser) await User.findByIdAndDelete(partUser._id);
        if (partProfile) await PartnerOrganization.findByIdAndDelete(partProfile._id);
        if (collUser) await User.findByIdAndDelete(collUser._id);
        if (collProfile) await Collector.findByIdAndDelete(collProfile._id);
        await mongoose.connection.close();
        console.log('Cleaned up test data.');
        process.exit(0);
    }
}

runHotfixTests();
