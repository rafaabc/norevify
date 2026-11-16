'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const { describe, it, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../helpers/mongo');
const { VALID_CONSENT } = require('../helpers/fixtures');
require('../helpers/email-mock');
const authService = require('../../lib/services/auth.service');
const userModel = require('../../lib/models/user.model');
const expensesService = require('../../lib/services/expenses.service');
const vehiclesService = require('../../lib/services/vehicles.service');
const vehicleModel = require('../../lib/models/vehicle.model');
const incomeModel = require('../../lib/models/income.model');
const stripeLib = require('../../lib/stripe.js');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const verifyAs =
  (sub = 'g-alice', email = 'alice@test.com') =>
  async () => ({ sub, email, emailVerified: true, name: 'Alice' });

async function signUpAlice() {
  const { token } = await authService.googleLogin(
    { idToken: 'tok', consent: VALID_CONSENT },
    verifyAs(),
  );
  return jwt.decode(token).id;
}

describe('data rights flow', () => {
  it('should reject account creation without consent', async () => {
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'tok' }, verifyAs()),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  it('should allow export and delete after signing up with Google', async () => {
    const userId = await signUpAlice();

    await expensesService.createExpense(userId, {
      category: 'Fuel',
      litres: 10,
      price_per_litre: 5.5,
      date: new Date(Date.now() - 86400000).toISOString(),
    });

    // Export should return user data with expenses, and must not leak internals
    const exported = await authService.exportUserData({ userId });
    assert.ok(exported.user.email === 'alice@test.com');
    assert.ok(exported.expenses.length > 0);
    assert.ok(!exported.user.password);
    assert.ok(exported.user.googleId === undefined);

    const [vehicle] = await vehiclesService.listVehicles(userId);
    await incomeModel.create({
      userId,
      vehicleId: vehicle.id,
      date: new Date(),
      amount: 100,
      source: 'Uber',
    });

    await authService.deleteAccount({ userId, idToken: 'fresh' }, verifyAs());

    // User and all owned records should no longer exist
    assert.strictEqual(await userModel.findById(userId), null);
    assert.strictEqual((await vehicleModel.findByUserId(userId)).length, 0);
    assert.strictEqual((await incomeModel.findByUserId(userId)).length, 0);
  });

  it('should refuse to delete when the Google re-authentication does not match the account', async () => {
    const userId = await signUpAlice();

    await assert.rejects(
      () => authService.deleteAccount({ userId, idToken: 'fresh' }, verifyAs('g-mallory')),
      (err) => err.status === 401,
    );

    assert.ok(await userModel.findById(userId), 'a mismatched identity must not delete the data');
  });

  it('cancels the Stripe subscription and scrubs billing fields when deleting an account with an active subscription', async () => {
    const user = await userModel.create({
      username: 'stripedeleteuser',
      email: 'stripedeleteuser@test.com',
      googleId: 'g-stripe',
    });
    await userModel.updatePlanAndBilling(user._id, {
      plan: 'pro',
      stripeCustomerId: 'cus_delete1',
      stripeSubscriptionId: 'sub_delete1',
    });

    let cancelledSubscriptionId = null;
    mock.method(stripeLib, 'getStripe', () => ({
      subscriptions: {
        cancel: async (subId) => {
          cancelledSubscriptionId = subId;
          return {};
        },
      },
    }));

    await authService.deleteAccount(
      { userId: user._id.toString(), idToken: 'fresh' },
      verifyAs('g-stripe', 'stripedeleteuser@test.com'),
    );

    assert.strictEqual(cancelledSubscriptionId, 'sub_delete1');
    assert.strictEqual(await userModel.findById(user._id), null);
  });
});
