'use strict';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const reminderModel = require('../../../src/models/reminder.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const USER_ID = new mongoose.Types.ObjectId();

describe('reminderModel', () => {
  it('should create a reminder with required type and at least one of dueDate/dueKm', async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    const rem = await reminderModel.create({
      userId: USER_ID, type: 'Maintenance', dueDate: future, dueKm: 60000,
    });
    assert.strictEqual(rem.type, 'Maintenance');
    assert.strictEqual(rem.dueKm, 60000);
    assert.strictEqual(rem.completedAt, null);
  });

  it('should reject invalid type', async () => {
    await assert.rejects(
      () => reminderModel.create({ userId: USER_ID, type: 'invalidType', dueKm: 1000 })
    );
  });

  it('should find by userId', async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    await reminderModel.create({ userId: USER_ID, type: 'inspection', dueDate: future });
    const list = await reminderModel.findByUserId(USER_ID);
    assert.strictEqual(list.length, 1);
  });
});
