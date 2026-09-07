const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../recytechbackend/models/User');
const Resident = require('../recytechbackend/models/Resident');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const Collector = require('../recytechbackend/models/Collector');

async function backfillProfiles() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    try {
        console.log('\n--- Checking Resident records ---');
        const unlinkedResidents = await Resident.find({ user: { $exists: false } });
        console.log(`Found ${unlinkedResidents.length} unlinked residents without user field.`);
        for (const resident of unlinkedResidents) {
            if (resident.email) {
                const user = await User.findOne({ email: resident.email.toLowerCase() });
                if (user) {
                    resident.user = user._id;
                    await resident.save();
                    console.log(`Linked Resident ${resident.email} -> User ${user._id}`);
                }
            }
        }

        console.log('\n--- Checking Partner Organization records ---');
        const unlinkedPartners = await PartnerOrganization.find({ user: { $exists: false } });
        console.log(`Found ${unlinkedPartners.length} unlinked partner orgs without user field.`);
        for (const partner of unlinkedPartners) {
            if (partner.email) {
                const user = await User.findOne({ email: partner.email.toLowerCase() });
                if (user) {
                    partner.user = user._id;
                    await partner.save();
                    console.log(`Linked Partner ${partner.email} -> User ${user._id}`);
                }
            }
        }

        console.log('\n--- Ensuring Unique Indexes on Collections ---');
        const safeSyncIndex = async (model) => {
            try {
                const indexes = await model.collection.indexes();
                const userIndex = indexes.find(i => i.name === 'user_1');
                if (userIndex && !userIndex.unique) {
                    console.log(`Dropping old non-unique user_1 index on ${model.modelName}...`);
                    await model.collection.dropIndex('user_1');
                }
            } catch (e) {
                // Ignore if collection or index does not exist
            }
            await model.syncIndexes();
        };

        await safeSyncIndex(Resident);
        await safeSyncIndex(PartnerOrganization);
        await safeSyncIndex(Collector);
        console.log('Indexes synced successfully.');

        console.log('\nBackfill & Index Sync Complete.');
    } catch (err) {
        console.error('Error during backfill:', err);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    backfillProfiles();
}

module.exports = { backfillProfiles };
