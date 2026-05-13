'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authService = require('../../../src/services/auth.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('Change-password flow integration', () => {
  it('should allow login with new password after change', async () => {
    await authService.register({ username: 'rafael', password: 'password1' });
    await authService.changePassword({ username: 'rafael', newPassword: 'newPass99' });
    const { token } = await authService.login({ username: 'rafael', password: 'newPass99' });
    assert.ok(token, 'login with new password must return a token');
  });

  it('should reject login with old password after change', async () => {
    await authService.register({ username: 'rafael', password: 'password1' });
    await authService.changePassword({ username: 'rafael', newPassword: 'newPass99' });
    await assert.rejects(
      () => authService.login({ username: 'rafael', password: 'password1' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });
});
