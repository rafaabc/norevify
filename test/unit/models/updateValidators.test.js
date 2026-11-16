'use strict';

// Mongoose skips schema validators (min, enum, maxlength) on update queries unless
// runValidators is on. Services validate their own input, but the schema is the last line
// of defense for any write path that forgets to — these guard that it actually applies.

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const reminderModel = require('../../../lib/models/reminder.model');
const expenseModel = require('../../../lib/models/expense.model');
const vehicleModel = require('../../../lib/models/vehicle.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const userId = () => new mongoose.Types.ObjectId();

describe('schema validators run on updates', () => {
  it('reminder.update rejects dueKm below min 0', async () => {
    const r = await reminderModel.create({ userId: userId(), type: 'Maintenance', dueKm: 1000 });
    await assert.rejects(() => reminderModel.update(r._id, { dueKm: -5 }), {
      name: 'ValidationError',
    });
    assert.strictEqual((await reminderModel.findById(r._id)).dueKm, 1000);
  });

  it('expense.update rejects a category outside the enum', async () => {
    const e = await expenseModel.create({
      userId: userId(),
      date: new Date(),
      category: 'Toll',
      amount: 5,
    });
    await assert.rejects(() => expenseModel.update(e._id, { category: 'Bogus' }), {
      name: 'ValidationError',
    });
  });

  it('vehicle.update rejects a name over maxlength 50', async () => {
    const v = await vehicleModel.create({ userId: userId(), name: 'Car' });
    await assert.rejects(() => vehicleModel.update(v._id, { name: 'x'.repeat(51) }), {
      name: 'ValidationError',
    });
  });
});
