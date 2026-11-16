'use strict';

// Google is the only sign-in method. These tests drive the real service↔model
// collaboration with a fake ID-token verifier — real Google OAuth can't be scripted.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const { VALID_CONSENT } = require('../../helpers/fixtures');
const authService = require('../../../lib/services/auth.service');
const userModel = require('../../../lib/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const fakeVerify =
  (sub = 'g-sub-1', email = 'testuser@example.com') =>
  async () => ({ sub, email, emailVerified: true, name: 'Test User' });

const signUp = (verify = fakeVerify()) =>
  authService.googleLogin({ idToken: 'tok', consent: VALID_CONSENT }, verify);

describe('Auth flow integration', () => {
  // TC-01-01
  it('should persist a Google sign-up so a later sign-in finds the same account', async () => {
    const first = await signUp();
    const second = await authService.googleLogin({ idToken: 'tok' }, fakeVerify());
    assert.strictEqual(jwt.decode(first.token).id, jwt.decode(second.token).id);
    assert.ok(await userModel.findByEmail('testuser@example.com'));
  });

  // TC-01-02
  it('should refuse to create an account without recorded consent', async () => {
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'tok' }, fakeVerify()),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
    assert.strictEqual(await userModel.findByEmail('testuser@example.com'), null);
  });

  // TC-02-04
  it('should return a well-formed JWT with user identity claims', async () => {
    const { token } = await signUp();
    const user = await userModel.findByEmail('testuser@example.com');
    const decoded = jwt.decode(token);
    assert.strictEqual(token.split('.').length, 3);
    assert.strictEqual(decoded.id, user._id.toString());
    assert.strictEqual(decoded.username, user.username);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
  });

  it('should persist language preference and return it in the next JWT', async () => {
    const { token: first } = await signUp();
    const { id } = jwt.decode(first);

    const { token } = await authService.updateLanguage({ id, language: 'en' });
    assert.strictEqual(jwt.verify(token, process.env.JWT_SECRET).language, 'en');

    const next = await authService.googleLogin({ idToken: 'tok' }, fakeVerify());
    assert.strictEqual(jwt.verify(next.token, process.env.JWT_SECRET).language, 'en');
  });

  it('should invalidate earlier sessions after signing out of all devices', async () => {
    const { token: oldToken } = await signUp();
    const { id, tv } = jwt.decode(oldToken);

    await authService.signOutEverywhere({ userId: id });

    // withAuth rejects a token whose tv no longer matches the stored tokenVersion.
    const current = (await userModel.findById(id)).tokenVersion ?? 0;
    assert.notStrictEqual(tv ?? 0, current, 'the old token must no longer match');

    // A fresh sign-in is issued against the new version and keeps working.
    const { token: newToken } = await authService.googleLogin({ idToken: 'tok' }, fakeVerify());
    assert.strictEqual(jwt.decode(newToken).tv, current);
  });
});
