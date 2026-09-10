'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const jwt = require('jsonwebtoken');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const userModel = require('../../../lib/models/user.model');
const authService = require('../../../lib/services/auth.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('authService.refreshToken()', () => {
  it('re-issues a JWT reflecting the current DB plan', async () => {
    const user = await userModel.create({
      username: 'refreshuser1',
      password: 'x',
      email: 'refreshuser1@test.com',
      plan: 'free',
    });

    await userModel.updatePlanAndBilling(user._id, { plan: 'pro' });

    const { token } = await authService.refreshToken({ id: user._id.toString() });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.plan, 'pro');
  });

  it('rejects an id that does not exist', async () => {
    const fakeId = '000000000000000000000000';
    await assert.rejects(
      () => authService.refreshToken({ id: fakeId }),
      (err) => err.status === 404,
    );
  });

  it('carries the current tokenVersion in the reissued token', async () => {
    const user = await userModel.create({
      username: 'refreshuser2',
      password: 'x',
      email: 'refreshuser2@test.com',
    });

    const { token } = await authService.refreshToken({ id: user._id.toString() });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.tv, 0);
  });

  it('preserves the original oiat across a refresh instead of resetting it', async () => {
    const user = await userModel.create({
      username: 'refreshuser3',
      password: 'x',
      email: 'refreshuser3@test.com',
    });
    const originalOiat = Math.floor(Date.now() / 1000) - 1000;

    const { token } = await authService.refreshToken({
      id: user._id.toString(),
      oiat: originalOiat,
    });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.oiat, originalOiat);
  });

  it('rejects a refresh once 30 days have passed since the original oiat', async () => {
    const user = await userModel.create({
      username: 'refreshuser4',
      password: 'x',
      email: 'refreshuser4@test.com',
    });
    const staleOiat = Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60;

    await assert.rejects(
      () => authService.refreshToken({ id: user._id.toString(), oiat: staleOiat }),
      (err) => err.status === 401,
    );
  });

  it('treats a missing oiat (pre-existing token) as starting the window now, not rejecting', async () => {
    const user = await userModel.create({
      username: 'refreshuser5',
      password: 'x',
      email: 'refreshuser5@test.com',
    });

    const { token } = await authService.refreshToken({ id: user._id.toString() });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.ok(typeof decoded.oiat === 'number');
  });

  it('rejects a refresh while the account is locked out', async () => {
    const user = await userModel.create({
      username: 'refreshuser6',
      password: 'x',
      email: 'refreshuser6@test.com',
    });
    await userModel.setLockUntil(user._id, new Date(Date.now() + 60_000));

    await assert.rejects(
      () => authService.refreshToken({ id: user._id.toString() }),
      (err) => err.status === 401,
    );
  });
});
