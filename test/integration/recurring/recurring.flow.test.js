'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const recurringService = require('../../../lib/services/recurring.service');
const expenseModel = require('../../../lib/models/expense.model');
const userModel = require('../../../lib/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

async function createUser() {
  return userModel.create({
    username: `u_${Date.now()}`,
    email: `u_${Date.now()}@test.com`,
    password: 'hashed',
    emailVerified: true,
  });
}

function monthsAgoISO(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

describe('Recurring expense flow integration', () => {
  it('catch-up generates one expense per elapsed month and leaves no duplicates', async () => {
    const user = await createUser();
    const uid = user._id.toString();

    // Rule starts 3 months ago, monthly → should produce 3 (or 4) occurrences
    await recurringService.createRule(uid, {
      category: 'Insurance',
      amount: 120,
      startDate: monthsAgoISO(3),
      interval: 1,
    });

    const first = await recurringService.runCatchUp(uid);
    assert.ok(first.created >= 3, `Expected >=3 created, got ${first.created}`);

    const expensesAfterFirst = await expenseModel.findByUserId(uid);
    assert.strictEqual(expensesAfterFirst.length, first.created);

    // All expenses should be tagged with the rule
    for (const exp of expensesAfterFirst) {
      assert.ok(exp.recurringRuleId, 'recurringRuleId should be set');
      assert.strictEqual(exp.category, 'Insurance');
      assert.strictEqual(exp.amount, 120);
    }

    // Second catch-up: idempotent — no new expenses
    const second = await recurringService.runCatchUp(uid);
    assert.strictEqual(second.created, 0);

    const expensesAfterSecond = await expenseModel.findByUserId(uid);
    assert.strictEqual(expensesAfterSecond.length, first.created);
  });

  it('runCatchUpAllUsers generates for all users', async () => {
    const u1 = await createUser();
    const u2 = await createUser();

    await recurringService.createRule(u1._id.toString(), {
      category: 'Tax',
      amount: 50,
      startDate: monthsAgoISO(1),
      interval: 1,
    });

    await recurringService.createRule(u2._id.toString(), {
      category: 'Parking',
      amount: 25,
      startDate: monthsAgoISO(1),
      interval: 1,
    });

    const { created } = await recurringService.runCatchUpAllUsers();
    assert.ok(created >= 2, `Expected >=2 total created, got ${created}`);

    const u1Expenses = await expenseModel.findByUserId(u1._id.toString());
    const u2Expenses = await expenseModel.findByUserId(u2._id.toString());
    assert.ok(u1Expenses.length >= 1);
    assert.ok(u2Expenses.length >= 1);
  });

  it('inactive rules are skipped during catch-up', async () => {
    const user = await createUser();
    const uid = user._id.toString();

    await recurringService.createRule(uid, {
      category: 'Toll',
      amount: 10,
      startDate: monthsAgoISO(2),
      interval: 1,
      active: false,
    });

    const { created } = await recurringService.runCatchUp(uid);
    assert.strictEqual(created, 0);
  });

  it('deleting a rule preserves already-generated expenses', async () => {
    const user = await createUser();
    const uid = user._id.toString();

    const rule = await recurringService.createRule(uid, {
      category: 'Maintenance',
      amount: 200,
      startDate: monthsAgoISO(2),
      interval: 1,
    });

    const { created } = await recurringService.runCatchUp(uid);
    assert.ok(created > 0);

    await recurringService.deleteRule(uid, rule.id);

    // Expenses still exist
    const expenses = await expenseModel.findByUserId(uid);
    assert.strictEqual(expenses.length, created);
  });
});
