const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

            return next();
        } catch (error) {
            console.error('Auth token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};

const admin = (req, res, next) => {
    if (req.user && ['Admin', 'Super Admin', 'admin', 'super_admin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const staffOnlyOrSuperAdmin = (req, res, next) => {
    if (req.user && ['Staff', 'Super Admin', 'staff', 'super_admin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as staff or super admin' });
    }
};

const staffOrAdmin = (req, res, next) => {
    if (req.user && ['Staff', 'Admin', 'Super Admin', 'staff', 'admin', 'super_admin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as staff or admin' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && ['Super Admin', 'super_admin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a super admin' });
    }
};

const staffOnly = (req, res, next) => {
    if (req.user && ['Staff', 'staff'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Access is restricted to Staff personnel only.' });
    }
};

const lgu = (req, res, next) => {
    if (req.user && ['partner_org', 'partner_organization', 'LGU', 'Partner Organization', 'PartnerOrganization'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Partner Organization' });
    }
};

const collector = (req, res, next) => {
    if (req.user && ['collector', 'Collector'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Collector' });
    }
};

const household = (req, res, next) => {
    if (req.user && ['household', 'resident', 'Resident', 'User'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Registered User / Household' });
    }
};

module.exports = { 
    protect, 
    admin, 
    staffOnly,
    staffOnlyOrSuperAdmin, 
    staffOrAdmin, 
    superAdmin, 
    lgu, 
    partnerOrg: lgu, 
    collector,
    household
};
