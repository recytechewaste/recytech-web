const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../recytechbackend/models/User');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const RecyclingCenter = require('../recytechbackend/models/RecyclingCenter');
const SensorReport = require('../recytechbackend/models/SensorReport');
const { staffOnly } = require('../recytechbackend/middleware/authMiddleware');
const {
    submitSensorReport,
    getMyReports,
    getAllReports,
    getReportStats,
    getReportById,
    updateReportStatus
} = require('../recytechbackend/controllers/sensorReportController');

function createMockRes() {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    return res;
}

async function runTest() {
    console.log('=== STARTING AUTOMATED TEST FOR SENSOR INCIDENT REPORTS (STAFF ONLY) ===\n');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    const testTimestamp = Date.now();
    const staffEmail = `test_staff_${testTimestamp}@recytech.test`;
    const adminEmail = `test_admin_${testTimestamp}@recytech.test`;
    const partnerEmail = `test_partner_${testTimestamp}@recytech.test`;

    let staffUser, adminUser, partnerUser, partnerOrg, testBin, createdReportId;

    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // 1. Create Staff User
        staffUser = await User.create({
            firstName: 'Staff',
            lastName: 'Technician',
            email: staffEmail,
            password: hashedPassword,
            role: 'Staff',
            status: 'Active'
        });
        console.log('✔ Staff user created:', staffUser.email, '| Role:', staffUser.role);

        // 2. Create Admin User
        adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'Supervisor',
            email: adminEmail,
            password: hashedPassword,
            role: 'Admin',
            status: 'Active'
        });
        console.log('✔ Admin user created:', adminUser.email, '| Role:', adminUser.role);

        // 3. Create Partner Org & User
        partnerUser = await User.create({
            firstName: 'Partner',
            lastName: 'Leader',
            email: partnerEmail,
            password: hashedPassword,
            role: 'partner_org',
            status: 'Active'
        });
        partnerOrg = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Barangay South Eco ${testTimestamp}`,
            contactPerson: 'Hon. Ramos',
            email: partnerEmail,
            password: hashedPassword,
            jurisdiction: 'Sector 4',
            status: 'Active'
        });
        console.log('✔ Partner Org created:', partnerOrg.name);

        // 4. Create Smart Bin
        testBin = await RecyclingCenter.create({
            name: `Smart Bin Sector 4 - Unit ${testTimestamp}`,
            address: 'Main Eco Hub, Barangay South',
            status: 'Operational',
            capacityKg: 500,
            currentFillKg: 50,
            assignedLgu: partnerOrg._id
        });
        console.log('✔ Test Smart Bin created:', testBin.name, '| Initial Status:', testBin.status);

        // ── TEST 1: Submit a Sensor Malfunction Report (Critical Severity) ──
        console.log('\n--- TEST 1: Submit Sensor Report (Partner Org) ---');
        const submitReq = {
            user: partnerUser,
            body: {
                binId: testBin._id.toString(),
                sensorType: 'Fill Level Sensor (Ultrasonic)',
                issueDescription: 'Ultrasonic transducer is outputting noisy echoes; bin lid locked improperly.',
                severity: 'Critical'
            }
        };
        const submitRes = createMockRes();
        await submitSensorReport(submitReq, submitRes);

        console.log('Submit Response Code:', submitRes.statusCode, '| Success:', submitRes.body?.success);
        if (submitRes.statusCode !== 201 || !submitRes.body?.data) {
            throw new Error(`Failed to submit report: ${JSON.stringify(submitRes.body)}`);
        }
        createdReportId = submitRes.body.data._id;
        console.log('✔ Created Report ID:', createdReportId);

        // Check if bin automatically transitioned to Maintenance
        const checkedBin = await RecyclingCenter.findById(testBin._id);
        console.log('✔ Bin status after Critical report:', checkedBin.status, '(Expected: Maintenance)');
        if (checkedBin.status !== 'Maintenance') {
            throw new Error(`Expected bin status to be 'Maintenance', got: ${checkedBin.status}`);
        }

        // ── TEST 2: Verify staffOnly middleware blocks Admin and allows Staff ──
        console.log('\n--- TEST 2: Role Authorization Checks (Admin 403 vs Staff 200) ---');
        
        let adminBlocked = false;
        const adminReq = { user: adminUser };
        const adminRes = createMockRes();
        staffOnly(adminReq, adminRes, () => { adminBlocked = false; });
        if (adminRes.statusCode === 403) {
            adminBlocked = true;
            console.log('✔ Admin user blocked with status 403 Forbidden on staffOnly middleware:', adminRes.body?.message);
        } else {
            throw new Error('Admin was NOT blocked by staffOnly middleware!');
        }

        let staffAllowed = false;
        const staffReq = { user: staffUser };
        const staffRes = createMockRes();
        staffOnly(staffReq, staffRes, () => { staffAllowed = true; });
        if (staffAllowed) {
            console.log('✔ Staff user successfully permitted through staffOnly middleware');
        } else {
            throw new Error('Staff user was blocked by staffOnly middleware!');
        }

        // ── TEST 3: Staff Fetches All Reports & Stats ──
        console.log('\n--- TEST 3: Staff Lists Reports & Fetches Stats ---');
        const listReq = { query: { status: 'Pending' } };
        const listRes = createMockRes();
        await getAllReports(listReq, listRes);
        console.log('List Reports Status:', listRes.statusCode, '| Total Reports Found:', listRes.body?.total);
        if (listRes.statusCode !== 200 || !listRes.body?.data) {
            throw new Error('Staff failed to list reports');
        }

        const statsReq = {};
        const statsRes = createMockRes();
        await getReportStats(statsReq, statsRes);
        console.log('Stats Response:', statsRes.statusCode, '| Stats Object:', statsRes.body?.stats);
        if (statsRes.statusCode !== 200 || !statsRes.body?.stats || statsRes.body.stats.pending < 1) {
            throw new Error('Staff failed to retrieve valid stats');
        }

        // ── TEST 4: Staff Resolves Report & Restores Bin Status ──
        console.log('\n--- TEST 4: Staff Resolves Incident & Restores Bin Status ---');
        const updateReq = {
            params: { id: createdReportId },
            user: staffUser,
            body: {
                status: 'Resolved',
                resolutionNotes: 'Calibrated transducer, reseated ESP32 GPIO cable, and cleared sensor obstruction.',
                restoreBinStatus: true
            }
        };
        const updateRes = createMockRes();
        await updateReportStatus(updateReq, updateRes);

        console.log('Update Status Code:', updateRes.statusCode, '| Result Message:', updateRes.body?.message);
        if (updateRes.statusCode !== 200 || updateRes.body?.data?.status !== 'Resolved') {
            throw new Error('Failed to resolve sensor report');
        }

        const restoredBin = await RecyclingCenter.findById(testBin._id);
        console.log('✔ Bin status after resolution:', restoredBin.status, '(Expected: Operational)');
        if (restoredBin.status !== 'Operational') {
            throw new Error(`Expected bin status to be restored to 'Operational', got: ${restoredBin.status}`);
        }

        console.log('\n=============================================================');
        console.log('🎉 ALL SENSOR INCIDENT REPORTS AUTOMATED TESTS PASSED! 🎉');
        console.log('=============================================================\n');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    } finally {
        // Cleanup test artifacts
        if (createdReportId) await SensorReport.findByIdAndDelete(createdReportId);
        if (testBin) await RecyclingCenter.findByIdAndDelete(testBin._id);
        if (partnerOrg) await PartnerOrganization.findByIdAndDelete(partnerOrg._id);
        if (partnerUser) await User.findByIdAndDelete(partnerUser._id);
        if (adminUser) await User.findByIdAndDelete(adminUser._id);
        if (staffUser) await User.findByIdAndDelete(staffUser._id);
        await mongoose.connection.close();
        console.log('Cleaned up test data and closed DB connection.');
        process.exit(0);
    }
}

runTest();
