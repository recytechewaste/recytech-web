const crypto = require('crypto');
const { AUTH_CONSTANTS } = require('../config/constants');

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashCode = (email, code, secret = process.env.JWT_SECRET) => {
    if (!secret) throw new Error('Email verification secret is not configured');
    return crypto.createHmac('sha256', secret)
        .update(`recytech-email-verification:${email}:${code}`)
        .digest('hex');
};

const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const createVerificationState = (email, now = new Date()) => {
    const code = generateCode();
    return {
        code,
        state: {
            codeHash: hashCode(email, code),
            expiresAt: new Date(now.getTime() + AUTH_CONSTANTS.PIN_EXPIRY_MS),
            attempts: 0,
            resendAvailableAt: new Date(now.getTime() + RESEND_COOLDOWN_MS)
        }
    };
};

const compareCode = (email, code, expectedHash) => {
    if (typeof code !== 'string' || typeof expectedHash !== 'string') return false;
    const actual = Buffer.from(hashCode(email, code), 'utf8');
    const expected = Buffer.from(expectedHash, 'utf8');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const isExpired = (state, now = new Date()) => !state?.expiresAt || new Date(state.expiresAt) <= now;

module.exports = {
    MAX_ATTEMPTS,
    RESEND_COOLDOWN_MS,
    generateCode,
    hashCode,
    createVerificationState,
    compareCode,
    isExpired
};
