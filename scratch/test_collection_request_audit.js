const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');
const RecyclingCenter = require('../recytechbackend/models/RecyclingCenter');
const Bin = require('../recytechbackend/models/Bin');
const Request = require('../recytechbackend/models/Request');

const { createLguRequest, getAllRequests, getRequestById, completeRequest } = require('../recytechbackend/controllers/requestController');
const { getMyBins } = require('../recytechbackend/controllers/partnerOrgController');

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
        }
    };
    return res;
};

const invoke = async (handler, req) => {
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

async function runAuditTests() {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    let partnerUser, partnerOrg, otherPartnerUser, otherPartnerOrg, collectorUser, collectorProfile;
    const createdRequestIds = [];

    try {
        const ts = Date.now();

        // 1. Create Partner 1 (Owner)
        partnerUser = await User.create({
            firstName: 'AuditPartner',
            lastName: 'One',
            email: `audit_part1_${ts}@recytech.test`,
            password: 'Password123!',
            role: 'partner_org',
            status: 'Active'
        });
        partnerOrg = await PartnerOrganization.create({
            user: partnerUser._id,
            name: `Audit Partner Org ${ts}`,
            contactPerson: 'Audit Contact',
            email: partnerUser.email,
            phone: '+639170000001',
            password: 'Password123!'
        });

        // 2. Create Partner 2 (Other Partner)
        otherPartnerUser = await User.create({
            firstName: 'AuditPartner',
            lastName: 'Two',
            email: `audit_part2_${ts}@recytech.test`,
            password: 'Password123!',
            role: 'partner_org',
            status: 'Active'
        });
        otherPartnerOrg = await PartnerOrganization.create({
            user: otherPartnerUser._id,
            name: `Audit Other Org ${ts}`,
            contactPerson: 'Other Contact',
            email: otherPartnerUser.email,
            phone: '+639170000002',
            password: 'Password123!'
        });

        // 3. Create Collector
        collectorUser = await User.create({
            firstName: 'AuditCollector',
            lastName: 'Driver',
            email: `audit_coll_${ts}@recytech.test`,
            password: 'Password123!',
            role: 'collector',
            status: 'Active'
        });
        collectorProfile = await Collector.create({
            user: collectorUser._id,
            firstName: 'AuditCollector',
            lastName: 'Driver',
            phone: '+639170000003',
            vehicleType: 'Van',
            vehiclePlate: 'XYZ-9999'
        });

        // 4. Create a RecyclingCenter assigned to Partner 1
        const testRc = await RecyclingCenter.create({
            name: `Audit Smart Bin RC ${ts}`,
            address: '123 Audit St, Manila',
            qrCode: `AUDIT-RC-${ts}`,
            assignedLgu: partnerOrg._id,
            status: 'Full',
            capacityKg: 500,
            currentFillKg: 450
        });

        // 5. Create a Bin assigned to Partner 1
        const testBin = await Bin.create({
            binId: `BIN-AUDIT-${ts}`,
            address: '456 Canonical Bin Rd, QC',
            location: { type: 'Point', coordinates: [121.0, 14.5] },
            assignedLgu: partnerOrg._id,
            status: 'Operational',
            fillLevel: 85
        });

        console.log('=== TEST SUITE: COLLECTION REQUEST AUDIT & VERIFICATION ===\n');

        // TEST A: my-bins returns identifier resolvable by POST /requests
        console.log('--- TEST A: my-bins returns identifier resolvable by POST /requests ---');
        const myBinsReq = { user: { _id: partnerUser._id, role: 'partner_org' } };
        const myBinsRes = await invoke(getMyBins, myBinsReq);
        console.log('my-bins total bins:', myBinsRes.data.totalBins);
        const firstBin = myBinsRes.data.bins[0];
        console.log('First bin from my-bins:', { _id: firstBin._id, name: firstBin.name });
        if (!firstBin._id) throw new Error('my-bins did not return bin _id');
        console.log('✔ TEST A PASSED: my-bins returns valid bin identity.\n');

        // TEST F: valid own bin (RecyclingCenter) -> request 201
        console.log('--- TEST F: valid own bin (RecyclingCenter identifier) -> request 201 ---');
        const createReq1 = {
            user: { _id: partnerUser._id, role: 'partner_org' },
            body: {
                binId: testRc._id.toString(),
                notes: 'Please collect ASAP, bin is full.',
                requestType: 'manual'
            }
        };
        const createRes1 = await invoke(createLguRequest, createReq1);
        console.log('Create request status:', createRes1.statusCode);
        console.log('Created request:', {
            _id: createRes1.data._id,
            binId: createRes1.data.bin?._id,
            binName: createRes1.data.bin?.name,
            binModel: createRes1.data.binModel,
            lgu: createRes1.data.lgu?.name,
            status: createRes1.data.status
        });
        if (createRes1.statusCode !== 201 || !createRes1.data._id) {
            throw new Error(`Expected 201 but got ${createRes1.statusCode}`);
        }
        createdRequestIds.push(createRes1.data._id);
        console.log('✔ TEST F PASSED: valid own RecyclingCenter bin successfully created collection request with 201.\n');

        // TEST G: duplicate active request -> 400
        console.log('--- TEST G: duplicate active request -> 400 ---');
        try {
            await invoke(createLguRequest, createReq1);
            throw new Error('Should have failed with duplicate active request');
        } catch (err) {
            console.log('Duplicate rejected as expected:', err.message);
            if (!err.message.includes('already exists')) throw err;
            console.log('✔ TEST G PASSED: duplicate active request rejected with 400.\n');
        }

        // TEST B: POST /requests accepts canonical Bin._id
        console.log('--- TEST B: POST /requests accepts canonical Bin._id ---');
        const createReq2 = {
            user: { _id: partnerUser._id, role: 'partner_org' },
            body: {
                binId: testBin._id.toString(),
                notes: 'Collecting canonical Bin model'
            }
        };
        const createRes2 = await invoke(createLguRequest, createReq2);
        console.log('Canonical Bin request created:', {
            _id: createRes2.data._id,
            binId: createRes2.data.bin?._id,
            binCode: createRes2.data.bin?.binId,
            binModel: createRes2.data.binModel
        });
        if (createRes2.statusCode !== 201) throw new Error('Failed to create request for canonical Bin._id');
        createdRequestIds.push(createRes2.data._id);
        console.log('✔ TEST B PASSED: POST /requests accepts canonical Bin._id.\n');

        // TEST C: POST /requests accepts documented public binId string (binId code or QR code)
        console.log('--- TEST C: POST /requests accepts documented public binId / qrCode string ---');
        // Delete request 2 so we can re-request by code
        await Request.findByIdAndDelete(createRes2.data._id);
        const createReq3 = {
            user: { _id: partnerUser._id, role: 'partner_org' },
            body: {
                binId: testBin.binId, // public code e.g. BIN-AUDIT-...
                notes: 'Requesting by public string code'
            }
        };
        const createRes3 = await invoke(createLguRequest, createReq3);
        console.log('Created by public string code:', {
            _id: createRes3.data._id,
            binCode: createRes3.data.bin?.binId
        });
        if (createRes3.statusCode !== 201) throw new Error('Failed to resolve by string binId');
        createdRequestIds.push(createRes3.data._id);
        console.log('✔ TEST C PASSED: POST /requests resolves documented public binId string code.\n');

        // TEST D: invalid identifier -> 404 Bin not found
        console.log('--- TEST D: invalid identifier -> 404 Bin not found ---');
        try {
            await invoke(createLguRequest, {
                user: { _id: partnerUser._id, role: 'partner_org' },
                body: { binId: new mongoose.Types.ObjectId().toString() }
            });
            throw new Error('Should have failed with 404');
        } catch (err) {
            console.log('Invalid identifier rejected:', err.message);
            if (!err.message.includes('Bin not found')) throw err;
            console.log('✔ TEST D PASSED: invalid identifier returns 404 Bin not found.\n');
        }

        // TEST E: valid bin owned by another Partner -> 403
        console.log('--- TEST E: valid bin owned by another Partner -> 403 ---');
        try {
            await invoke(createLguRequest, {
                user: { _id: otherPartnerUser._id, role: 'partner_org' }, // Other partner attempting to request Partner 1's bin
                body: { binId: testRc._id.toString() }
            });
            throw new Error('Should have failed with 403');
        } catch (err) {
            console.log('Ownership mismatch rejected:', err.message);
            if (!err.message.includes('Forbidden')) throw err;
            console.log('✔ TEST E PASSED: unassigned/unowned bin returns 403 Forbidden.\n');
        }

        // TEST H: same request _id remains compatible with Collector workflow
        console.log('--- TEST H: Collector workflow compatibility ---');
        // Assign collector to request 1
        const targetReqId = createRes1.data._id;
        await Request.findByIdAndUpdate(targetReqId, {
            assignedCollector: collectorProfile._id,
            status: 'assigned'
        });

        // Collector completes request
        const completeReq = {
            user: { _id: collectorUser._id, role: 'collector' },
            params: { id: targetReqId.toString() },
            body: {
                collectedWaste: [
                    { category: 'Small Electronics', quantity: 15, unit: 'kg' },
                    { category: 'Batteries', quantity: 5, unit: 'kg' }
                ],
                notes: 'Collected all waste successfully.'
            }
        };
        const completeRes = await invoke(completeRequest, completeReq);
        console.log('Collector complete response message:', completeRes.data.message);
        console.log('Completed request status:', completeRes.data.request?.status);
        console.log('Completed request bin fill reset check:');
        const reloadedRc = await RecyclingCenter.findById(testRc._id);
        console.log('RecyclingCenter currentFillKg after collection:', reloadedRc.currentFillKg, 'status:', reloadedRc.status);
        if (completeRes.data.request?.status !== 'completed' || reloadedRc.currentFillKg !== 0) {
            throw new Error('Collector completion workflow failed or bin not reset');
        }
        console.log('✔ TEST H PASSED: Collector complete workflow fully compatible and resets bin fill status.\n');

        // TEST LIVE IDENTIFIER: 6a88276eac828f5af9dc9268
        console.log('--- TEST LIVE IDENTIFIER: 6a88276eac828f5af9dc9268 ---');
        // Check resolving 6a88276eac828f5af9dc9268 directly
        const liveRc = await RecyclingCenter.findById('6a88276eac828f5af9dc9268');
        console.log('Live identifier exists in RecyclingCenter:', !!liveRc);
        console.log('Live identifier details:', {
            _id: liveRc?._id,
            name: liveRc?.name,
            qrCode: liveRc?.qrCode,
            assignedLgu: liveRc?.assignedLgu
        });

        console.log('\n====================================================');
        console.log('🎉 ALL 8 AUDIT & WORKFLOW TESTS PASSED 100%! 🎉');
        console.log('====================================================');

    } finally {
        console.log('\nCleaning up audit test records...');
        for (const reqId of createdRequestIds) {
            await Request.findByIdAndDelete(reqId).catch(() => {});
        }
        if (partnerUser) await User.findByIdAndDelete(partnerUser._id).catch(() => {});
        if (partnerOrg) await PartnerOrganization.findByIdAndDelete(partnerOrg._id).catch(() => {});
        if (otherPartnerUser) await User.findByIdAndDelete(otherPartnerUser._id).catch(() => {});
        if (otherPartnerOrg) await PartnerOrganization.findByIdAndDelete(otherPartnerOrg._id).catch(() => {});
        if (collectorUser) await User.findByIdAndDelete(collectorUser._id).catch(() => {});
        if (collectorProfile) await Collector.findByIdAndDelete(collectorProfile._id).catch(() => {});
        console.log('Cleanup complete.');
        await mongoose.disconnect();
    }
}

runAuditTests();
