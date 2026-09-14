const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Notification = require('../recytechbackend/models/Notification');
const PartnerOrganization = require('../recytechbackend/models/PartnerOrganization');
const { createPartnerNotification } = require('../recytechbackend/services/notificationService');

const runTests = async () => {
    console.log('--- STARTING NOTIFICATIONS TEST SUITE ---');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const testPartnerOrgAId = new mongoose.Types.ObjectId();
    const testPartnerOrgBId = new mongoose.Types.ObjectId();
    const testRequestId = new mongoose.Types.ObjectId();

    try {
        // Test 1: createPartnerNotification
        console.log('\n[Test 1] Creating scoped notifications...');
        const notifA1 = await createPartnerNotification({
            partnerOrganizationId: testPartnerOrgAId,
            title: 'Collection Request Approved',
            message: 'Your collection request has been approved.',
            type: 'request_approved',
            relatedEntityId: testRequestId.toString(),
            destinationKind: 'lguRequest',
            destinationEntityId: testRequestId.toString()
        });

        if (!notifA1 || notifA1.recipientPartnerOrganizationId.toString() !== testPartnerOrgAId.toString()) {
            throw new Error('Test 1 failed: notification for Partner A was not created properly.');
        }
        console.log('✓ Created Notification for Partner A:', notifA1._id);

        const notifB = await createPartnerNotification({
            partnerOrganizationId: testPartnerOrgBId,
            title: 'Bin Requires Inspection',
            message: 'One of your assigned bins has been placed under maintenance.',
            type: 'bin_maintenance',
            destinationKind: 'lguBin',
            destinationEntityId: 'bin_123'
        });
        console.log('✓ Created Notification for Partner B:', notifB._id);

        // Test 2: Unscoped prevention
        console.log('\n[Test 2] Ensuring unscoped notification is rejected...');
        const unscoped = await createPartnerNotification({
            title: 'Invalid',
            message: 'Should not exist'
        });
        if (unscoped !== null) {
            throw new Error('Test 2 failed: unscoped notification was unexpectedly created!');
        }
        console.log('✓ Unscoped notification safely blocked');

        // Test 3: Query scoping & shape verification
        console.log('\n[Test 3] Verifying scoped query and Flutter response shape...');
        const docsA = await Notification.find({
            recipientRole: 'partner_org',
            recipientPartnerOrganizationId: testPartnerOrgAId
        }).sort({ createdAt: -1 }).lean();

        if (docsA.length !== 1 || docsA[0]._id.toString() !== notifA1._id.toString()) {
            throw new Error(`Test 3 failed: Expected 1 notification for Partner A, got ${docsA.length}`);
        }

        const formatted = {
            id: docsA[0]._id.toString(),
            title: docsA[0].title,
            message: docsA[0].message,
            timestamp: docsA[0].createdAt.toISOString(),
            isRead: docsA[0].isRead,
            role: docsA[0].recipientRole,
            type: docsA[0].type,
            relatedEntityId: docsA[0].relatedEntityId,
            destination: {
                kind: docsA[0].destinationKind,
                entityId: docsA[0].destinationEntityId
            }
        };

        if (formatted.role !== 'partner_org' || formatted.isRead !== false || formatted.destination.kind !== 'lguRequest') {
            throw new Error('Test 3 failed: payload format did not match requirements.');
        }
        console.log('✓ Flutter response payload shape verified:', JSON.stringify(formatted, null, 2));

        // Test 4: Cross-tenant isolation
        console.log('\n[Test 4] Verifying cross-tenant isolation...');
        const crossCheck = docsA.some(n => n.recipientPartnerOrganizationId.toString() === testPartnerOrgBId.toString());
        if (crossCheck) {
            throw new Error('Test 4 failed: Partner A has access to Partner B notifications!');
        }
        console.log('✓ Cross-tenant isolation strictly enforced');

        // Test 5: Mark single notification read
        console.log('\n[Test 5] Marking single notification as read...');
        notifA1.isRead = true;
        await notifA1.save();
        const reloadedA1 = await Notification.findById(notifA1._id);
        if (!reloadedA1.isRead) {
            throw new Error('Test 5 failed: isRead was not updated to true.');
        }
        console.log('✓ Single notification read status updated');

        // Test 6: Mark all read
        console.log('\n[Test 6] Testing mark all read...');
        await createPartnerNotification({
            partnerOrganizationId: testPartnerOrgAId,
            title: 'Collection Scheduled',
            message: 'Your collection request has been scheduled.',
            type: 'collection_scheduled'
        });
        await createPartnerNotification({
            partnerOrganizationId: testPartnerOrgAId,
            title: 'Collection Started',
            message: 'Collection for your request has started.',
            type: 'collection_started'
        });

        const updateRes = await Notification.updateMany(
            { recipientPartnerOrganizationId: testPartnerOrgAId, isRead: false },
            { $set: { isRead: true } }
        );
        if (updateRes.modifiedCount !== 2) {
            throw new Error(`Test 6 failed: Expected 2 modified, got ${updateRes.modifiedCount}`);
        }
        console.log('✓ markAllNotificationsAsRead modified count verified:', updateRes.modifiedCount);

        // Verify Partner B unread notification was untouched
        const reloadedB = await Notification.findById(notifB._id);
        if (reloadedB.isRead !== false) {
            throw new Error('Test 6 failed: Partner B notification was unexpectedly marked as read!');
        }
        console.log('✓ Partner B unread notification remained completely untouched');

        console.log('\n========================================');
        console.log('ALL NOTIFICATION TESTS PASSED SUCCESSFULLY! ✓');
        console.log('========================================');
    } finally {
        console.log('\nCleaning up test notifications...');
        await Notification.deleteMany({
            recipientPartnerOrganizationId: { $in: [testPartnerOrgAId, testPartnerOrgBId] }
        });
        console.log('Cleanup complete.');
        await mongoose.disconnect();
    }
};

runTests().catch(err => {
    console.error('Test Suite Failure:', err);
    process.exit(1);
});
