'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authService = require('../../../src/services/auth.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('Auth flow integration', () => {
  // TC-01-01
  it('should persist registered user so a subsequent login succeeds', async () => {
    await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    const { token } = await authService.login({ username: 'testuser', password: 'password1' });
    assert.ok(token, 'login must return a token for the just-registered user');
  });

  // TC-01-03
  it('should reject duplicate username registration with "already taken" message', async () => {
    await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    await assert.rejects(
      () => authService.register({ username: 'testuser', password: 'other_pass1', email: 'testuser2@example.com' }),
      (err) => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /already taken/i);
        return true;
      }
    );
  });

  // TC-02-01
  it('should return an access token when valid credentials are provided', async () => {
    await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    const result = await authService.login({ username: 'testuser', password: 'password1' });
    assert.ok(result.token);
    assert.strictEqual(typeof result.token, 'string');
    assert.ok(result.token.length > 0);
  });

  // TC-02-04
  it('should return a well-formed JWT with user identity claims', async () => {
    const user = await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    const { token } = await authService.login({ username: 'testuser', password: 'password1' });
    const segments = token.split('.');
    const decoded = jwt.decode(token);
    assert.strictEqual(segments.length, 3);
    assert.strictEqual(decoded.id, user.id);
    assert.strictEqual(decoded.username, 'testuser');
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
  });

  it('should persist language preference and return it in the next JWT', async () => {
    const { id } = await authService.register({ username: 'langflow', password: 'password1', email: 'langflow@x.com' });

    const { token } = await authService.updateLanguage({ id, language: 'en' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.language, 'en');

    const { token: token2 } = await authService.login({ username: 'langflow', password: 'password1' });
    const payload2 = jwt.verify(token2, process.env.JWT_SECRET);
    assert.strictEqual(payload2.language, 'en');
  });

  // TC-02-08
  it('should not lock account after multiple failed login attempts', async () => {
    await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    for (let i = 0; i < 5; i++) {
      await assert.rejects(
        () => authService.login({ username: 'testuser', password: 'wrongpass' }),
        { status: 401 }
      );
    }
    const { token } = await authService.login({ username: 'testuser', password: 'password1' });
    assert.ok(token);
  });
});
