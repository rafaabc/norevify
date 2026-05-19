'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authService = require('../../../src/services/auth.service');
const expensesService = require('../../../src/services/expenses.service');
const userModel = require('../../../src/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const TODAY = new Date().toISOString().slice(0, 10);

describe('Odometer flow', () => {
  it('fuel odometer raises user.currentKm; older reading does not lower it', async () => {
    await authService.register({ username: 'od1', password: 'pass1234', email: 'od1@test.com' });
    const user = await userModel.findByUsername('od1');
    const uid = user._id.toString();

    await expensesService.createExpense(uid, {
      date: TODAY, category: 'Fuel', litres: 30, price_per_litre: 1.5, odometer: 1000,
    });
    let u = await userModel.findById(uid);
    assert.strictEqual(u.currentKm, 1000);

    await expensesService.createExpense(uid, {
      date: TODAY, category: 'Fuel', litres: 30, price_per_litre: 1.5, odometer: 500,
    });
    u = await userModel.findById(uid);
    assert.strictEqual(u.currentKm, 1000);
  });

  it('manual override allows setting a lower value', async () => {
    await authService.register({ username: 'od2', password: 'pass1234', email: 'od2@test.com' });
    const user = await userModel.findByUsername('od2');
    const uid = user._id.toString();

    await authService.updateOdometer({ id: uid, currentKm: 5000 });
    const result = await authService.updateOdometer({ id: uid, currentKm: 1000 });
    assert.strictEqual(result.currentKm, 1000);
  });
});
