/**
 * Seed Script: Populate Initial Audit Log Entries
 *
 * Ensures the system has a demonstrative audit log history for capstone presentation
 * without affecting existing production data.
 *
 * Usage:
 *   node recytechbackend/scripts/seedAuditLogs.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const SAMPLE_EVENTS = [
    {
        action: 'USER_LOGIN',
        actionCategory: 'SECURITY',
        actor: { name: 'Super Admin', email: 'superadmin@recytech.local', role: 'Super Admin' },
        targetEntity: { entityType: 'User', name: 'Super Admin' },
        details: { method: 'JWT_BEARER', ip: '192.168.1.10', platform: 'Web Console' },
        daysAgo: 12
    },
    {
        action: 'REWARD_POINTS_UPDATED',
        actionCategory: 'SYSTEM_CONFIG',
        actor: { name: 'Super Admin', email: 'superadmin@recytech.local', role: 'Super Admin' },
        targetEntity: { entityType: 'RewardPoint', name: 'Small Electronics' },
        details: { previousPoints: 10, newPoints: 15, updatedField: 'pointsPerItem' },
        daysAgo: 9
    },
    {
        action: 'COLLECTOR_CREATED',
        actionCategory: 'COLLECTOR_MANAGEMENT',
        actor: { name: 'Admin Operations', email: 'admin@recytech.local', role: 'Admin' },
        targetEntity: { entityType: 'Collector', name: 'Carlos Mendez' },
        details: { phone: '09171234567', vehiclePlate: 'ABC1234', vehicleType: 'Pickup Truck' },
        daysAgo: 7
    },
    {
        action: 'USER_ROLE_CHANGED',
        actionCategory: 'ACCESS_CONTROL',
        actor: { name: 'Super Admin', email: 'superadmin@recytech.local', role: 'Super Admin' },
        targetEntity: { entityType: 'User', name: 'Elena Torres' },
        details: { previousRole: 'Staff', newRole: 'Admin', reason: 'Promotion to Operations Head' },
        daysAgo: 5
    },
    {
        action: 'USER_CREATED',
        actionCategory: 'USER_MANAGEMENT',
        actor: { name: 'Elena Torres', email: 'elena@recytech.local', role: 'Admin' },
        targetEntity: { entityType: 'User', name: 'Mark Bautista' },
        details: { role: 'Staff', email: 'mark.bautista@recytech.local', status: 'Active' },
        daysAgo: 4
    },
    {
        action: 'PASSWORD_CHANGED',
        actionCategory: 'SECURITY',
        actor: { name: 'Elena Torres', email: 'elena@recytech.local', role: 'Admin' },
        targetEntity: { entityType: 'User', name: 'Elena Torres' },
        details: { note: 'Password updated with current password verification' },
        daysAgo: 2
    },
    {
        action: 'REWARD_RULE_CREATED',
        actionCategory: 'SYSTEM_CONFIG',
        actor: { name: 'Super Admin', email: 'superadmin@recytech.local', role: 'Super Admin' },
        targetEntity: { entityType: 'RewardPoint', name: 'Cables & Chargers' },
        details: { pointsPerItem: 5, isActive: true },
        daysAgo: 1
    },
    {
        action: 'USER_LOGIN',
        actionCategory: 'SECURITY',
        actor: { name: 'Super Admin', email: 'superadmin@recytech.local', role: 'Super Admin' },
        targetEntity: { entityType: 'User', name: 'Super Admin' },
        details: { role: 'Super Admin', ip: '127.0.0.1' },
        daysAgo: 0
    }
];

async function seedAuditLogs() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables.');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        const existingCount = await AuditLog.countDocuments();
        if (existingCount > 0) {
            console.log(`ℹ️ AuditLog already contains ${existingCount} records. Skipping seed.`);
            await mongoose.disconnect();
            return;
        }

        console.log('🌱 Seeding initial audit log records...');
        const now = Date.now();
        const recordsToInsert = SAMPLE_EVENTS.map(ev => {
            const date = new Date(now - ev.daysAgo * 86400000 - Math.floor(Math.random() * 3600000));
            return {
                action: ev.action,
                actionCategory: ev.actionCategory,
                actor: ev.actor,
                targetEntity: ev.targetEntity,
                details: ev.details,
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RecyTech Web Admin',
                status: 'SUCCESS',
                createdAt: date,
                updatedAt: date
            };
        });

        await AuditLog.insertMany(recordsToInsert);
        console.log(`✅ Successfully seeded ${recordsToInsert.length} audit log entries.`);

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seedAuditLogs();
