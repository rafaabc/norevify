'use strict';

// NOTE: Real Google OAuth cannot be scripted — no API or E2E tests for this flow.
// These tests use a fake verifier to exercise the full service↔model collaboration.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../helpers/mongo');
const { VALID_CONSENT } = require('../helpers/fixtures');
const { createUser } = require('../helpers/createUser');
const authService = require('../../lib/services/auth.service');
const userModel = require('../../lib/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const fakeVerify =
  (sub = 'g-sub-1', email = 'guser@gmail.com', emailVerified = true) =>
  async () => ({ sub, email, emailVerified, name: 'G User' });

describe('Google auth flow integration', () => {
  it('should create a new user on first Google sign-in and sign in again finding the same user', async () => {
    const { token: t1 } = await authService.googleLogin(
      { idToken: 'tok', consent: VALID_CONSENT },
      fakeVerify(),
    );
    const { token: t2 } = await authService.googleLogin({ idToken: 'tok' }, fakeVerify());
    assert.strictEqual(jwt.decode(t1).id, jwt.decode(t2).id, 'same user on second login');
  });

  it('should store the consent record and the Google identity on the new account', async () => {
    await authService.googleLogin(
      { idToken: 'tok', consent: VALID_CONSENT, currency: 'EUR', ip: '198.51.100.7' },
      fakeVerify(),
    );
    const user = await userModel.findByGoogleId('g-sub-1');
    assert.strictEqual(user.email, 'guser@gmail.com');
    assert.strictEqual(user.currency, 'EUR');
    assert.strictEqual(user.consent.policyVersion, VALID_CONSENT.policyVersion);
    assert.match(user.consent.ipHash, /^[0-9a-f]{16}$/);
  });

  it('should auto-link Google to a legacy account sharing the same verified email', async () => {
    const user = await createUser({ username: 'alice', email: 'guser@gmail.com' });
    const { token } = await authService.googleLogin({ idToken: 'tok' }, fakeVerify());
    const decoded = jwt.decode(token);
    assert.strictEqual(decoded.id, user.id, 'same user id after auto-link');
    assert.strictEqual(decoded.username, 'alice');
    assert.strictEqual((await userModel.findById(user.id)).googleId, 'g-sub-1');
  });

  it('should not create or link anything for an unverified Google email', async () => {
    await createUser({ username: 'alice', email: 'guser@gmail.com' });
    await assert.rejects(
      () =>
        authService.googleLogin(
          { idToken: 'tok', consent: VALID_CONSENT },
          fakeVerify('g-sub-1', 'guser@gmail.com', false),
        ),
      (err) => err.status === 401,
    );
    assert.strictEqual(await userModel.findByGoogleId('g-sub-1'), null);
  });
});
