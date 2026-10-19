const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.JWT_SECRET = 'test-only-email-verification-secret';

const verification = require('../recytechbackend/services/emailVerificationService');
const emailService = require('../recytechbackend/services/emailService');
const axios = require('axios');
const User = require('../recytechbackend/models/User');
const { verifyEmail, loginUser, registerUser } = require('../recytechbackend/controllers/authController');

const invoke = async (handler, body) => {
    const response = {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; if (this.resolve) this.resolve({ response: this }); return this; },
        cookie() { return this; }
    };
    return new Promise((resolve) => {
        response.resolve = resolve;
        handler({ body, headers: {}, cookies: {} }, response, (error) => resolve({ response, nextError: error }));
    });
};

const invokeRegistration = async (body) => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;
    const originalDelete = User.findByIdAndDelete;
    const originalResidentCreate = require('../recytechbackend/models/Resident').create;
    const originalAxiosPost = axios.post;
    const originalEnv = { ...process.env };
    let createdUser;
    try {
        process.env.EMAIL_SERVICE_PROVIDER = 'brevo';
        process.env.BREVO_API_KEY = 'test-key-not-a-secret';
        process.env.BREVO_SENDER_EMAIL = 'sender@example.test';
        User.findOne = async () => null;
        User.create = async (document) => {
            createdUser = { ...document, _id: 'user-id' };
            return createdUser;
        };
        User.findByIdAndDelete = async () => {};
        require('../recytechbackend/models/Resident').create = async () => ({ _id: 'profile-id' });
        axios.post = async () => ({ data: { messageId: 'test-message-id' } });
        const result = await invoke(registerUser, {
            firstName: 'Test',
            lastName: 'User',
            email: 'person@example.test',
            password: 'Password1!',
            ...body
        });
        return { ...result, createdUser };
    } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
        User.findByIdAndDelete = originalDelete;
        require('../recytechbackend/models/Resident').create = originalResidentCreate;
        axios.post = originalAxiosPost;
        for (const key of Object.keys(process.env)) {
            if (!(key in originalEnv)) delete process.env[key];
        }
        Object.assign(process.env, originalEnv);
    }
};

test('all household registration sources require email verification', async () => {
    for (const body of [
        { role: 'household' },
        { role: 'household', source: 'mobile' },
        { role: 'household', source: 'web' }
    ]) {
        const result = await invokeRegistration(body);
        assert.equal(result.response.statusCode, 201);
        assert.equal(result.response.body.emailVerificationRequired, true);
        assert.equal(result.createdUser.emailVerified, false);
        assert.ok(result.createdUser.emailVerification.codeHash);
    }
});

test('Staff web registration keeps the legacy response and approval status', async () => {
    const result = await invokeRegistration({ role: 'Staff', source: 'web' });
    assert.equal(result.response.statusCode, 201);
    assert.equal(result.response.body.emailVerificationRequired, undefined);
    assert.equal(result.response.body.profileId, null);
    assert.equal(result.response.body.accountStatus, 'inactive');
    assert.equal(result.createdUser.emailVerified, undefined);
    assert.equal(result.createdUser.status, 'Inactive');
});

test('verification codes are secure, hashed, expiring, and constant-time comparable', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const result = verification.createVerificationState('person@example.test', now);

    assert.match(result.code, /^\d{6}$/);
    assert.notEqual(result.state.codeHash, result.code);
    assert.equal(verification.compareCode('person@example.test', result.code, result.state.codeHash), true);
    assert.equal(verification.compareCode('person@example.test', '000000', result.state.codeHash), false);
    assert.equal(verification.isExpired(result.state, now), false);
    assert.equal(verification.isExpired(result.state, new Date(now.getTime() + 15 * 60 * 1000)), true);
});

test('verification attempts are limited and resend cooldown is represented in state', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const result = verification.createVerificationState('person@example.test', now);

    assert.equal(result.state.attempts, 0);
    assert.equal(result.state.resendAvailableAt.getTime(), now.getTime() + verification.RESEND_COOLDOWN_MS);
    assert.equal(verification.MAX_ATTEMPTS, 5);
});

test('Brevo provider success is reported only after the HTTP request resolves', async () => {
    const originalPost = axios.post;
    const originalEnv = { ...process.env };
    try {
        process.env.EMAIL_SERVICE_PROVIDER = 'brevo';
        process.env.BREVO_API_KEY = 'test-key-not-a-secret';
        process.env.BREVO_SENDER_EMAIL = 'sender@example.test';
        axios.post = async () => ({ data: { messageId: 'test-message-id' } });
        const result = await emailService.sendVerificationEmail('person@example.test', 'Person', '123456');
        assert.equal(result.success, true);
    } finally {
        axios.post = originalPost;
        for (const key of Object.keys(process.env)) {
            if (!(key in originalEnv)) delete process.env[key];
        }
        Object.assign(process.env, originalEnv);
    }
});

test('Brevo provider failures are reported as failures', async () => {
    const originalPost = axios.post;
    const originalEnv = { ...process.env };
    try {
        process.env.EMAIL_SERVICE_PROVIDER = 'brevo';
        process.env.BREVO_API_KEY = 'test-key-not-a-secret';
        axios.post = async () => { throw Object.assign(new Error('network failure'), { code: 'ETIMEDOUT' }); };
        const result = await emailService.sendVerificationEmail('person@example.test', 'Person', '123456');
        assert.equal(result.success, false);
    } finally {
        axios.post = originalPost;
        for (const key of Object.keys(process.env)) {
            if (!(key in originalEnv)) delete process.env[key];
        }
        Object.assign(process.env, originalEnv);
    }
});

test('verification hash uses HMAC rather than a reversible or plaintext code', () => {
    const digest = verification.hashCode('person@example.test', '123456');
    assert.equal(digest, crypto.createHmac('sha256', process.env.JWT_SECRET)
        .update('recytech-email-verification:person@example.test:123456')
        .digest('hex'));
    assert.equal(digest.includes('123456'), false);
});

test('verification succeeds once and invalidates the stored state', async () => {
    const originalFindOne = User.findOne;
    const originalFindOneAndUpdate = User.findOneAndUpdate;
    const now = new Date();
    const generated = verification.createVerificationState('person@example.test', now);
    const user = {
        email: 'person@example.test',
        emailVerified: false,
        emailVerification: generated.state,
        save: async function save() { this.saved = true; }
    };
    User.findOne = async () => user;
    User.findOneAndUpdate = async () => {
        user.emailVerified = true;
        user.emailVerification = undefined;
        return user;
    };
    try {
        const result = await invoke(verifyEmail, { email: user.email, pin: generated.code });
        assert.equal(result.nextError, undefined);
        assert.equal(result.response.body.emailVerificationRequired, false);
        assert.equal(user.emailVerified, true);
        assert.equal(user.emailVerification, undefined);
    } finally {
        User.findOne = originalFindOne;
        User.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test('incorrect verification codes increment attempts and eventually lock the code', async () => {
    const originalFindOne = User.findOne;
    const originalFindOneAndUpdate = User.findOneAndUpdate;
    const generated = verification.createVerificationState('person@example.test');
    const user = {
        email: 'person@example.test',
        emailVerified: false,
        emailVerification: generated.state,
        save: async function save() {}
    };
    User.findOne = async () => user;
    User.findOneAndUpdate = async () => {
        user.emailVerification.attempts += 1;
        return user;
    };
    try {
        for (let attempt = 1; attempt <= verification.MAX_ATTEMPTS; attempt += 1) {
            const result = await invoke(verifyEmail, { email: user.email, pin: '000000' });
            assert.ok(result.nextError);
        }
        assert.equal(user.emailVerification.attempts, verification.MAX_ATTEMPTS);
        const locked = await invoke(verifyEmail, { email: user.email, pin: generated.code });
        assert.equal(locked.response.statusCode, 429);
    } finally {
        User.findOne = originalFindOne;
        User.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test('expired verification codes are rejected', async () => {
    const originalFindOne = User.findOne;
    const generated = verification.createVerificationState('person@example.test', new Date(Date.now() - 20 * 60 * 1000));
    const user = { email: 'person@example.test', emailVerified: false, emailVerification: generated.state, save: async () => {} };
    User.findOne = async () => user;
    try {
        const result = await invoke(verifyEmail, { email: user.email, pin: generated.code });
        assert.equal(result.response.statusCode, 400);
        assert.match(result.nextError.message, /expired/i);
    } finally {
        User.findOne = originalFindOne;
    }
});

test('login rejects explicitly unverified users and preserves legacy compatibility', async () => {
    const originalFindOne = User.findOne;
    const bcrypt = require('bcryptjs');
    const password = await bcrypt.hash('Password1!', 4);
    const unverified = { _id: 'unverified', email: 'person@example.test', password, status: 'Active', emailVerified: false };
    User.findOne = async () => unverified;
    try {
        const result = await invoke(loginUser, { email: unverified.email, password: 'Password1!' });
        assert.equal(result.response.statusCode, 403);
        assert.equal(result.response.body.code, 'email_verification_required');

        const legacy = { ...unverified, _id: 'legacy', emailVerified: undefined, save: async () => {} };
        User.findOne = async () => legacy;
        const legacyResult = await invoke(loginUser, { email: legacy.email, password: 'Password1!' });
        assert.notEqual(legacyResult.response.body?.code, 'email_verification_required');
    } finally {
        User.findOne = originalFindOne;
    }
});
