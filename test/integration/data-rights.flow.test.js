'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../helpers/mongo');
require('../helpers/email-mock');
const authService = require('../../lib/services/auth.service');
const userModel = require('../../lib/models/user.model');
const expensesService = require('../../lib/services/expenses.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const VALID_CONSENT = { policyVersion: '2026-05-20', acceptedAt: new Date().toISOString() };

describe('data rights flow', () => {
  it('should reject registration without consent', async () => {
    await assert.rejects(
      () => authService.register({ username: 'alice', password: 'password1', email: 'alice@test.com' }),
      (err) => { assert.strictEqual(err.status, 400); return true; }
    );
  });

  it('should allow export and delete after register + verify', async () => {
    const { id: userId } = await authService.register({ username: 'alice', password: 'password1', email: 'alice@test.com', consent: VALID_CONSENT });

    // manually verify email (simulate email verification)
    await userModel.setEmailVerified(userId);

    // Create an expense
    await expensesService.createExpense(userId, { category: 'Fuel', litres: 10, price_per_litre: 5.5, date: new Date(Date.now() - 86400000).toISOString() });

    // Export should return user data with expenses
    const exported = await authService.exportUserData({ userId });
    assert.ok(exported.user.username === 'alice');
    assert.ok(exported.expenses.length > 0);
    assert.ok(!exported.user.password); // must not leak password
    assert.ok(exported.user.emailVerificationToken === undefined); // must not leak token

    // Delete account
    await authService.deleteAccount({ userId, password: 'password1' });

    // User should no longer exist
    const deletedUser = await userModel.findById(userId);
    assert.strictEqual(deletedUser, null);
  });
});
