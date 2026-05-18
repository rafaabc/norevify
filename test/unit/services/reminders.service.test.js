'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const remindersService = require('../../../src/services/reminders.service');
const reminderModel = require('../../../src/models/reminder.model');
const userModel = require('../../../src/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const FUTURE_DATE = (days) => new Date(Date.now() + days * 86400000);
const PAST_DATE   = (days) => new Date(Date.now() - days * 86400000);

describe('remindersService.computeStatus()', () => {
  it('returns "done" when completedAt is set', () => {
    const s = remindersService.computeStatus({ completedAt: new Date() }, 0);
    assert.strictEqual(s, 'done');
  });

  it('returns "overdue" when dueDate is in the past', () => {
    const s = remindersService.computeStatus({ dueDate: PAST_DATE(1) }, 0);
    assert.strictEqual(s, 'overdue');
  });

  it('returns "overdue" when currentKm >= dueKm', () => {
    const s = remindersService.computeStatus({ dueKm: 10000 }, 10000);
    assert.strictEqual(s, 'overdue');
  });

  it('returns "dueSoon" when dueDate within 7 days', () => {
    const s = remindersService.computeStatus({ dueDate: FUTURE_DATE(3) }, 0);
    assert.strictEqual(s, 'dueSoon');
  });

  it('returns "dueSoon" when dueKm within 500 km', () => {
    const s = remindersService.computeStatus({ dueKm: 10000 }, 9700);
    assert.strictEqual(s, 'dueSoon');
  });

  it('returns "upcoming" otherwise', () => {
    const s = remindersService.computeStatus({ dueDate: FUTURE_DATE(30), dueKm: 20000 }, 5000);
    assert.strictEqual(s, 'upcoming');
  });
});
