const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole, CANONICAL_ROLES } = require('../utils/roleHelper');

const protect = async (req, res, next) => {
    let token;

    // Look for token in authorization header first (Bearer), fallback to cookies
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found, token invalid' });
            }

            // Real-time status revalidation: reject inactive, disabled, or rejected accounts
            if (['Inactive', 'Disabled', 'Rejected', 'inactive', 'disabled', 'rejected'].includes(req.user.status)) {
                return res.status(403).json({ message: 'Account is deactivated or disabled. Please contact an administrator.' });
            }

            if (req.user.emailVerified === false) {
                return res.status(403).json({
                    code: 'email_verification_required',
                    message: 'Please verify your email before accessing this account.',
                    email: req.user.email,
                    emailVerificationRequired: true
                });
            }

            return next();
        } catch (error) {
            console.error('Auth token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};

/**
 * Super Administrator Only:
 * Highest privilege level — manages other Admins, system configurations, and reward rules.
 */
const superAdmin = (req, res, next) => {
    if (req.user && normalizeRole(req.user.role) === CANONICAL_ROLES.SUPER_ADMIN) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Super Administrator access required.' });
};

/**
 * Administrator or Super Administrator:
 * Operations management — collectors, partner orgs, households, and bins.
 */
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const role = normalizeRole(req.user.role);
    if (role === CANONICAL_ROLES.ADMIN || role === CANONICAL_ROLES.SUPER_ADMIN) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Administrator or Super Administrator access required.' });
};

/**
 * Staff, Admin, or Super Administrator:
 * Operational monitoring and dispatching.
 */
const staffOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const role = normalizeRole(req.user.role);
    if ([CANONICAL_ROLES.STAFF, CANONICAL_ROLES.ADMIN, CANONICAL_ROLES.SUPER_ADMIN].includes(role)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Staff, Admin, or Super Admin access required.' });
};

/**
 * Frontline Staff Only
 */
const staffOnly = (req, res, next) => {
    if (req.user && normalizeRole(req.user.role) === CANONICAL_ROLES.STAFF) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Access is restricted to Staff personnel only.' });
};

/**
 * Staff or Super Admin Only (Admin is strictly excluded)
 */
const staffOnlyOrSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const role = normalizeRole(req.user.role);
    if ([CANONICAL_ROLES.STAFF, CANONICAL_ROLES.SUPER_ADMIN].includes(role)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Access is restricted to Staff or Super Admin only.' });
};

const lgu = (req, res, next) => {
    if (req.user && normalizeRole(req.user.role) === CANONICAL_ROLES.PARTNER_ORG) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized as a Partner Organization' });
};

const collector = (req, res, next) => {
    if (req.user && normalizeRole(req.user.role) === CANONICAL_ROLES.COLLECTOR) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized as a Collector' });
};

const household = (req, res, next) => {
    if (req.user && normalizeRole(req.user.role) === CANONICAL_ROLES.HOUSEHOLD) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized as a Registered User / Household' });
};

module.exports = { 
    protect, 
    admin, 
    superAdmin,
    staffOnly,
    staffOrAdmin, 
    staffOnlyOrSuperAdmin, 
    lgu, 
    partnerOrg: lgu, 
    collector,
    household
};
