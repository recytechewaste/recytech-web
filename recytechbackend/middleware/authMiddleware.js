const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Look for token in cookies first, fallback to authorization header
    token = req.cookies?.jwt || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const staffOnlyOrSuperAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Staff' || req.user.role === 'Super Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as staff or super admin' });
    }
};

const staffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Staff' || req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as staff or admin' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Super Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a super admin' });
    }
};

const lgu = (req, res, next) => {
    if (req.user && (req.user.role === 'LGU' || req.user.role === 'Partner Organization' || req.user.role === 'PartnerOrganization')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Partner Organization' });
    }
};

const collector = (req, res, next) => {
    if (req.user && req.user.role === 'Collector') {
        next();
    } else {
        res.status(401).send('Not authorized as a Collector');
    }
};

module.exports = { 
    protect, 
    admin, 
    staffOnlyOrSuperAdmin, 
    staffOrAdmin, 
    superAdmin, 
    lgu, 
    partnerOrg: lgu, 
    collector 
};
