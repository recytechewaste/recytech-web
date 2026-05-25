const AUTH_CONSTANTS = {
    PIN_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
    JWT_EXPIRES_IN: '30d',
    RESET_TOKEN_EXPIRES_IN: '1h',
    MIN_PASSWORD_LENGTH: 6,
};

module.exports = {
    AUTH_CONSTANTS
};