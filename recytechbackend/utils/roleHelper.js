const Resident = require('../models/Resident');
const PartnerOrganization = require('../models/PartnerOrganization');
const Collector = require('../models/Collector');

const CANONICAL_ROLES = {
    HOUSEHOLD: 'household',
    PARTNER_ORG: 'partner_org',
    COLLECTOR: 'collector',
    STAFF: 'Staff',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin'
};

const normalizeRole = (role) => {
    if (!role) return CANONICAL_ROLES.HOUSEHOLD;
    const raw = role.toString().trim().toLowerCase();

    if (['household', 'resident', 'user', 'registered user', 'registered_user'].includes(raw)) {
        return CANONICAL_ROLES.HOUSEHOLD;
    }
    if (['partner_org', 'partner_organization', 'partner organization', 'partnerorg', 'lgu'].includes(raw)) {
        return CANONICAL_ROLES.PARTNER_ORG;
    }
    if (['collector'].includes(raw)) {
        return CANONICAL_ROLES.COLLECTOR;
    }
    if (['staff'].includes(raw)) {
        return CANONICAL_ROLES.STAFF;
    }
    if (['admin'].includes(raw)) {
        return CANONICAL_ROLES.ADMIN;
    }
    if (['super admin', 'super_admin', 'superadmin'].includes(raw)) {
        return CANONICAL_ROLES.SUPER_ADMIN;
    }
    return role;
};

const getProfileForUser = async (userId, role) => {
    if (!userId) return null;
    const canonical = normalizeRole(role);

    if (canonical === CANONICAL_ROLES.HOUSEHOLD) {
        const doc = await Resident.findOne({ user: userId });
        return { profileId: doc?._id || null, profileType: 'Resident', profile: doc };
    }
    if (canonical === CANONICAL_ROLES.PARTNER_ORG) {
        const doc = await PartnerOrganization.findOne({ user: userId });
        return { profileId: doc?._id || null, profileType: 'PartnerOrganization', profile: doc };
    }
    if (canonical === CANONICAL_ROLES.COLLECTOR) {
        const doc = await Collector.findOne({ user: userId });
        return { profileId: doc?._id || null, profileType: 'Collector', profile: doc };
    }
    return { profileId: null, profileType: null, profile: null };
};

module.exports = {
    CANONICAL_ROLES,
    normalizeRole,
    getProfileForUser
};
