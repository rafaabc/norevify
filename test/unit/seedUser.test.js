'use strict';

// Drift guard: test/helpers/seedUser.js mints session JWTs by hand because the
// suites cannot go through a real login. If issueToken() in auth.service.js gains,
// loses or renames a claim, these tests fail instead of the e2e/API suites silently
// running against tokens the app would never issue.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../helpers/mongo');
require('../helpers/email-mock');
const authService = require('../../lib/services/auth.service');
const userModel = require('../../lib/models/user.model');
const { signSessionToken } = require('../helpers/seedUser');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const fakeVerify = async () => ({
  sub: 'g-sub-1',
  email: 'guser@gmail.com',
  emailVerified: true,
  name: 'G User',
});

describe('seedUser.signSessionToken()', () => {
  it('should issue the same claim set as the real issueToken()', async () => {
    const { token: real } = await authService.googleLogin({ idToken: 'tok' }, fakeVerify);
    const realClaims = jwt.verify(real, process.env.JWT_SECRET);
    const user = await userModel.findById(realClaims.id);

    const seeded = jwt.verify(signSessionToken(user), process.env.JWT_SECRET);

    assert.deepStrictEqual(Object.keys(seeded).sort(), Object.keys(realClaims).sort());
  });

  it('should carry identical values for every claim except the timestamps', async () => {
    const { token: real } = await authService.googleLogin({ idToken: 'tok' }, fakeVerify);
    const realClaims = jwt.verify(real, process.env.JWT_SECRET);
    const user = await userModel.findById(realClaims.id);

    const seeded = jwt.verify(signSessionToken(user), process.env.JWT_SECRET);

    for (const key of ['iat', 'exp', 'oiat']) {
      delete realClaims[key];
      delete seeded[key];
    }
    assert.deepStrictEqual(seeded, realClaims);
  });

  it('should throw a clear error when JWT_SECRET is missing', () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      assert.throws(() => signSessionToken({ _id: 'x', username: 'u' }), /JWT_SECRET is not set/);
    } finally {
      process.env.JWT_SECRET = saved;
    }
  });
});
