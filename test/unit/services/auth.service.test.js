'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authService = require('../../../src/services/auth.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

// ---------------------------------------------------------------------------
// US-01 — User Registration
// ---------------------------------------------------------------------------
describe('authService.register()', () => {
  // TC-01-02
  it('should throw 409 when username is already taken', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    await assert.rejects(
      () => authService.register({ username: 'alice', password: 'password2', email: 'alice2@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /already taken/i);
        return true;
      }
    );
  });

  it('should throw 409 when email is already registered', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    await assert.rejects(
      () => authService.register({ username: 'alice2', password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /already registered/i);
        return true;
      }
    );
  });

  // TC-01-04
  it('should throw 400 when username is missing', async () => {
    await assert.rejects(
      () => authService.register({ password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, password and email are required/i);
        return true;
      }
    );
  });

  // TC-01-05
  it('should throw 400 when password is missing', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, password and email are required/i);
        return true;
      }
    );
  });

  it('should throw 400 when email is missing', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', password: 'password1' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, password and email are required/i);
        return true;
      }
    );
  });

  it('should throw 400 when email format is invalid', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', password: 'password1', email: 'not-an-email' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /invalid email format/i);
        return true;
      }
    );
  });

  // TC-01-07
  it('should throw 400 when password has fewer than 8 characters', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', password: '1234567', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at least 8 characters/i);
        return true;
      }
    );
  });

  // TC-01-08
  it('should succeed when password has exactly 8 characters', async () => {
    const result = await authService.register({ username: 'alice', password: '12345678', email: 'alice@example.com' });
    assert.ok(result.id);
    assert.strictEqual(result.username, 'alice');
  });

  // TC-01-09
  it('should throw 400 when username has fewer than 3 characters', async () => {
    await assert.rejects(
      () => authService.register({ username: 'ab', password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  // TC-01-10
  it('should succeed when username has exactly 3 characters', async () => {
    const result = await authService.register({ username: 'abc', password: 'password1', email: 'abc@example.com' });
    assert.strictEqual(result.username, 'abc');
  });

  // TC-01-11
  it('should throw 400 when username contains spaces', async () => {
    await assert.rejects(
      () => authService.register({ username: 'ali ce', password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  // TC-01-12
  it('should throw 400 when username contains special characters other than underscore', async () => {
    await assert.rejects(
      () => authService.register({ username: 'ali@ce', password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  // TC-01-13
  it('should succeed when username contains alphanumeric characters and underscores', async () => {
    const result = await authService.register({ username: 'alice_01', password: 'password1', email: 'alice_01@example.com' });
    assert.strictEqual(result.username, 'alice_01');
  });

  // TC-01-14
  it('should throw 400 when username exceeds 50 characters', async () => {
    const longUsername = 'a'.repeat(51);
    await assert.rejects(
      () => authService.register({ username: longUsername, password: 'password1', email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  // TC-01-15
  it('should succeed when username has exactly 50 characters', async () => {
    const username = 'a'.repeat(50);
    const result = await authService.register({ username, password: 'password1', email: 'long@example.com' });
    assert.strictEqual(result.username, username);
  });

  // TC-01-16
  it('should throw 400 when password exceeds 20 characters', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', password: 'a'.repeat(21), email: 'alice@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at most 20/i);
        return true;
      }
    );
  });

  // TC-01-17
  it('should succeed when password has exactly 20 characters', async () => {
    const result = await authService.register({ username: 'alice', password: 'a'.repeat(20), email: 'alice@example.com' });
    assert.ok(result.id);
  });
});

// ---------------------------------------------------------------------------
// US-02 — User Login
// ---------------------------------------------------------------------------
describe('authService.login()', () => {
  beforeEach(async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
  });

  // TC-02-02
  it('should throw 401 when password is invalid', async () => {
    await assert.rejects(
      () => authService.login({ username: 'alice', password: 'wrongpass' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /Invalid credentials/i);
        return true;
      }
    );
  });

  // TC-02-03
  it('should throw 401 when username does not exist', async () => {
    await assert.rejects(
      () => authService.login({ username: 'nobody', password: 'password1' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /Invalid credentials/i);
        return true;
      }
    );
  });

  // TC-02-05
  it('should return a JWT that expires in exactly 1 hour when JWT_EXPIRES_IN is 1h', async () => {
    const { token } = await authService.login({ username: 'alice', password: 'password1' });
    const decoded = jwt.decode(token);
    assert.strictEqual(decoded.exp - decoded.iat, 3600);
  });

  it('should throw 400 when login is called without username', async () => {
    await assert.rejects(
      () => authService.login({ password: 'password1' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username and password are required/i);
        return true;
      }
    );
  });

  it('should throw 400 when login is called without password', async () => {
    await assert.rejects(
      () => authService.login({ username: 'alice' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username and password are required/i);
        return true;
      }
    );
  });

  it('should default JWT expiry to 1 hour when JWT_EXPIRES_IN env is not set', async () => {
    const original = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;
    try {
      const { token } = await authService.login({ username: 'alice', password: 'password1' });
      const decoded = jwt.decode(token);
      assert.strictEqual(decoded.exp - decoded.iat, 3600);
    } finally {
      process.env.JWT_EXPIRES_IN = original;
    }
  });
});

// ---------------------------------------------------------------------------
// US-03 — Change Password
// ---------------------------------------------------------------------------
describe('authService.changePassword()', () => {
  it('should update password when username exists and credentials are valid', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    const result = await authService.changePassword({ username: 'alice', currentPassword: 'password1', newPassword: 'newPass99' });
    assert.strictEqual(result.message, 'Password updated successfully');
  });

  it('should throw 401 when currentPassword is wrong', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    await assert.rejects(
      () => authService.changePassword({ username: 'alice', currentPassword: 'wrongPass1', newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid credentials/i);
        return true;
      }
    );
  });

  it('should throw 404 when username not found', async () => {
    await assert.rejects(
      () => authService.changePassword({ username: 'nobody', currentPassword: 'password1', newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.match(err.message, /user not found/i);
        return true;
      }
    );
  });

  it('should throw 400 when newPassword is too short', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    await assert.rejects(
      () => authService.changePassword({ username: 'alice', currentPassword: 'password1', newPassword: '1234567' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at least 8 characters/i);
        return true;
      }
    );
  });

  it('should throw 400 when newPassword is too long', async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    await assert.rejects(
      () => authService.changePassword({ username: 'alice', currentPassword: 'password1', newPassword: 'a'.repeat(21) }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at most 20/i);
        return true;
      }
    );
  });

  it('should throw 400 when username is missing', async () => {
    await assert.rejects(
      () => authService.changePassword({ currentPassword: 'password1', newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, currentPassword and newPassword are required/i);
        return true;
      }
    );
  });

  it('should throw 400 when currentPassword is missing', async () => {
    await assert.rejects(
      () => authService.changePassword({ username: 'alice', newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, currentPassword and newPassword are required/i);
        return true;
      }
    );
  });

  it('should throw 400 when newPassword is missing', async () => {
    await assert.rejects(
      () => authService.changePassword({ username: 'alice', currentPassword: 'password1' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /username, currentPassword and newPassword are required/i);
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// US-04 — Forgot Password
// ---------------------------------------------------------------------------
describe('authService.forgotPassword()', () => {
  beforeEach(async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
  });

  it('should return 200 message when email is not registered (no enumeration)', async () => {
    const mockSend = async () => {};
    const result = await authService.forgotPassword({ email: 'nobody@example.com' }, mockSend);
    assert.match(result.message, /reset link was sent/i);
  });

  it('should return 200 message and call sendEmail when email exists', async () => {
    let sentTo = null;
    const mockSend = async ({ to }) => { sentTo = to; };
    const result = await authService.forgotPassword({ email: 'alice@example.com' }, mockSend);
    assert.match(result.message, /reset link was sent/i);
    assert.strictEqual(sentTo, 'alice@example.com');
  });

  it('should include a valid reset JWT in the reset URL', async () => {
    let capturedUrl = null;
    const mockSend = async ({ resetUrl }) => { capturedUrl = resetUrl; };
    await authService.forgotPassword({ email: 'alice@example.com' }, mockSend);
    assert.ok(capturedUrl, 'resetUrl should be set');
    const token = new URL(capturedUrl).searchParams.get('token');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.username, 'alice');
    assert.strictEqual(payload.purpose, 'reset');
  });

  it('should throw 400 when email is missing', async () => {
    await assert.rejects(
      () => authService.forgotPassword({}),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /email is required/i);
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// US-05 — Reset Password
// ---------------------------------------------------------------------------
describe('authService.resetPassword()', () => {
  let validToken;

  beforeEach(async () => {
    await authService.register({ username: 'alice', password: 'password1', email: 'alice@example.com' });
    validToken = jwt.sign(
      { username: 'alice', purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('should update password when token is valid', async () => {
    const result = await authService.resetPassword({ token: validToken, newPassword: 'newPass99' });
    assert.strictEqual(result.message, 'Password updated successfully');
  });

  it('should allow login with new password after reset', async () => {
    await authService.resetPassword({ token: validToken, newPassword: 'newPass99' });
    const { token } = await authService.login({ username: 'alice', password: 'newPass99' });
    assert.ok(token);
  });

  it('should throw 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { username: 'alice', purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    await assert.rejects(
      () => authService.resetPassword({ token: expiredToken, newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid or expired/i);
        return true;
      }
    );
  });

  it('should throw 401 when token has wrong purpose', async () => {
    const loginToken = jwt.sign(
      { username: 'alice', purpose: 'login' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    await assert.rejects(
      () => authService.resetPassword({ token: loginToken, newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /invalid or expired/i);
        return true;
      }
    );
  });

  it('should throw 401 when token is malformed', async () => {
    await assert.rejects(
      () => authService.resetPassword({ token: 'not.a.token', newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it('should throw 400 when newPassword is too short', async () => {
    await assert.rejects(
      () => authService.resetPassword({ token: validToken, newPassword: '1234567' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at least 8 characters/i);
        return true;
      }
    );
  });

  it('should throw 400 when newPassword is too long', async () => {
    await assert.rejects(
      () => authService.resetPassword({ token: validToken, newPassword: 'a'.repeat(21) }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /at most 20/i);
        return true;
      }
    );
  });

  it('should throw 400 when token is missing', async () => {
    await assert.rejects(
      () => authService.resetPassword({ newPassword: 'newPass99' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /token and newPassword are required/i);
        return true;
      }
    );
  });
});
