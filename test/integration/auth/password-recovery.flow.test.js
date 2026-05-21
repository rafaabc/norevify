'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.BASE_URL   = process.env.BASE_URL   || 'http://localhost:3000';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
require('../../helpers/email-mock');
const authService = require('../../../lib/services/auth.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const VALID_CONSENT = { policyVersion: '2026-05-20', acceptedAt: new Date().toISOString() };
const USER = { username: 'alice', password: 'OldPass99', email: 'alice@example.com', consent: VALID_CONSENT };

async function registerAlice() {
  await authService.register(USER);
}

async function captureResetToken(email = USER.email) {
  let capturedUrl = null;
  const mockSend = async ({ resetUrl }) => { capturedUrl = resetUrl; };
  await authService.forgotPassword({ email }, mockSend);
  if (!capturedUrl) return null;
  return new URL(capturedUrl).searchParams.get('token');
}

describe('Password recovery integration flow', () => {
  // TC-PR-01
  it('should allow login with new password after full forgot→reset cycle', async () => {
    await registerAlice();
    const token = await captureResetToken();
    assert.ok(token, 'reset token must be present');

    await authService.resetPassword({ token, newPassword: 'NewPass99' });

    const { token: loginToken } = await authService.login({ username: USER.username, password: 'NewPass99' });
    assert.ok(loginToken);
  });

  // TC-PR-02
  it('should reject login with old password after reset', async () => {
    await registerAlice();
    const token = await captureResetToken();
    await authService.resetPassword({ token, newPassword: 'NewPass99' });

    await assert.rejects(
      () => authService.login({ username: USER.username, password: USER.password }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid credentials/i);
        return true;
      }
    );
  });

  // TC-PR-03
  it('should not reveal whether email is registered (enumeration prevention)', async () => {
    await registerAlice();
    const mockSend = async () => {};

    const [resExisting, resNonExisting] = await Promise.all([
      authService.forgotPassword({ email: USER.email }, mockSend),
      authService.forgotPassword({ email: 'nobody@example.com' }, mockSend),
    ]);

    assert.strictEqual(resExisting.message, resNonExisting.message);
  });

  // TC-PR-04
  it('should not send email when address is not registered', async () => {
    let emailSent = false;
    const mockSend = async () => { emailSent = true; };
    await authService.forgotPassword({ email: 'nobody@example.com' }, mockSend);
    assert.strictEqual(emailSent, false);
  });

  // TC-PR-05
  it('should embed a valid JWT with purpose=reset in the reset URL', async () => {
    await registerAlice();
    const token = await captureResetToken();
    assert.ok(token);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.username, USER.username);
    assert.strictEqual(payload.purpose, 'reset');
    assert.ok(payload.exp > Math.floor(Date.now() / 1000));
  });

  // TC-PR-06
  it('should reject resetPassword with an expired token', async () => {
    await registerAlice();
    const expiredToken = jwt.sign(
      { username: USER.username, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    await assert.rejects(
      () => authService.resetPassword({ token: expiredToken, newPassword: 'NewPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid or expired/i);
        return true;
      }
    );
  });

  // TC-PR-07
  it('should reject resetPassword when token purpose is not "reset"', async () => {
    await registerAlice();
    const loginToken = jwt.sign(
      { username: USER.username, purpose: 'auth' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await assert.rejects(
      () => authService.resetPassword({ token: loginToken, newPassword: 'NewPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid or expired/i);
        return true;
      }
    );
  });

  // TC-PR-08
  it('should allow a second password reset with a fresh token', async () => {
    await registerAlice();

    const token1 = await captureResetToken();
    await authService.resetPassword({ token: token1, newPassword: 'NewPass99' });

    // Simulate a second forgot-password request
    const token2 = await captureResetToken();
    await authService.resetPassword({ token: token2, newPassword: 'AnotherPass1' });

    const { token: loginToken } = await authService.login({ username: USER.username, password: 'AnotherPass1' });
    assert.ok(loginToken);
  });
});
