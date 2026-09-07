const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');
const { CANONICAL_ROLES, normalizeRole, getProfileForUser } = require('../recytechbackend/utils/roleHelper');

async function runPhase3Tests() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Safely sync model indexes
    const safeSyncIndex = async (model) => {
        try {
            const indexes = await model.collection.indexes();
            const userIndex = indexes.find(i => i.name === 'user_1');
            if (userIndex && !userIndex.unique) {
                await model.collection.dropIndex('user_1');
            }
        } catch (e) {
            // Ignore if index doesn't exist
        }
        await model.syncIndexes();
    };

    await safeSyncIndex(Resident);
    await safeSyncIndex(PartnerOrganization);
    await safeSyncIndex(Collector);

    const timestamp = Date.now();
    const testUserEmail = `phase3_user_${timestamp}@recytech.test`;

    try {
        console.log('\n--- TEST 1: Role Helper Normalization ---');
        if (normalizeRole('Resident') !== CANONICAL_ROLES.HOUSEHOLD) throw new Error('Normalization failed for Resident');
        if (normalizeRole('LGU') !== CANONICAL_ROLES.PARTNER_ORG) throw new Error('Normalization failed for LGU');
        if (normalizeRole('Collector') !== CANONICAL_ROLES.COLLECTOR) throw new Error('Normalization failed for Collector');
        if (normalizeRole('Staff') !== CANONICAL_ROLES.STAFF) throw new Error('Normalization failed for Staff');
        if (normalizeRole('Super Admin') !== CANONICAL_ROLES.SUPER_ADMIN) throw new Error('Normalization failed for Super Admin');
        console.log('✅ TEST 1 PASSED: Role helper normalizes all canonical roles correctly.');

        console.log('\n--- TEST 2: 1-to-1 Unique Constraint on Resident.user ---');
        const user = await User.create({
            firstName: 'Unique',
            lastName: 'Test',
            email: testUserEmail,
            password: 'HashedPassword123!',
            role: 'household',
            status: 'Active'
        });

        // First profile creation should succeed
        const res1 = await Resident.create({
            user: user._id,
            email: `res1_${timestamp}@recytech.test`,
            firstName: 'Unique',
            lastName: 'Test',
            status: 'Active'
        });
        console.log('Created first Resident profile linked to User:', res1._id);

        // Second profile creation with the SAME User._id should fail with duplicate key error (E11000)
        let dupFailed = false;
        try {
            await Resident.create({
                user: user._id,
                email: `res2_${timestamp}@recytech.test`,
                firstName: 'Duplicate',
                lastName: 'Test',
                status: 'Active'
            });
        } catch (err) {
            dupFailed = true;
            console.log('Caught expected duplicate key rejection:', err.message);
        }

        if (!dupFailed) {
            throw new Error('Test 2 Failed: Duplicate profile was allowed on Resident.user unique index!');
        }
        console.log('✅ TEST 2 PASSED: 1-to-1 unique mapping enforced on Resident.user.');

        console.log('\n--- TEST 3: getProfileForUser Profile Resolution ---');
        const resolved = await getProfileForUser(user._id, 'household');
        console.log('Resolved profile:', resolved.profileType, resolved.profileId);
        if (resolved.profileType !== 'Resident' || resolved.profileId.toString() !== res1._id.toString()) {
            throw new Error('Test 3 Failed: getProfileForUser did not resolve the linked Resident profile.');
        }
        console.log('✅ TEST 3 PASSED: getProfileForUser resolved accurate profile data.');

        console.log('\n--- CLEANING UP TEST DATA ---');
        await User.findByIdAndDelete(user._id);
        await Resident.deleteMany({ email: { $in: [`res1_${timestamp}@recytech.test`, `res2_${timestamp}@recytech.test`] } });
        console.log('Cleaned up test records.');

        console.log('\n🎉 ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('❌ Phase 3 test error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runPhase3Tests();
