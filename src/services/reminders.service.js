'use strict';

const mongoose = require('mongoose');
const reminderModel = require('../models/reminder.model');
const userModel = require('../models/user.model');
const { REMINDER_TYPES } = reminderModel;

const LEAD_DAYS = 7;
const LEAD_KM = 500;
const DAY_MS = 86400000;

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function computeStatus(reminder, currentKm, now = new Date()) {
  if (reminder.completedAt) return 'done';
  const overdueByDate = reminder.dueDate && new Date(reminder.dueDate) < now;
  const overdueByKm = reminder.dueKm !== undefined && reminder.dueKm !== null && currentKm >= reminder.dueKm;
  if (overdueByDate || overdueByKm) return 'overdue';

  const dueSoonByDate = reminder.dueDate &&
    (new Date(reminder.dueDate) - now) <= LEAD_DAYS * DAY_MS;
  const dueSoonByKm = reminder.dueKm !== undefined && reminder.dueKm !== null &&
    (reminder.dueKm - currentKm) <= LEAD_KM;
  if (dueSoonByDate || dueSoonByKm) return 'dueSoon';

  return 'upcoming';
}

function validateCreateBody(body) {
  if (!body.type) throw makeError(400, 'type is required');
  if (!REMINDER_TYPES.includes(body.type))
    throw makeError(400, `type must be one of: ${REMINDER_TYPES.join(', ')}`);
  if (body.dueDate === undefined && body.dueKm === undefined)
    throw makeError(400, 'must provide dueDate or dueKm');

  if (body.dueDate !== undefined) {
    const d = new Date(body.dueDate);
    if (isNaN(d.getTime())) throw makeError(400, 'dueDate is invalid');
    if (d < new Date()) throw makeError(400, 'dueDate cannot be in the past');
  }
  if (body.dueKm !== undefined) {
    if (typeof body.dueKm !== 'number' || body.dueKm <= 0)
      throw makeError(400, 'dueKm must be a positive number');
  }
  if (body.intervalMonths !== undefined) {
    if (typeof body.intervalMonths !== 'number' || body.intervalMonths <= 0)
      throw makeError(400, 'intervalMonths must be a positive number');
    if (body.dueDate === undefined) throw makeError(400, 'intervalMonths requires dueDate');
  }
  if (body.intervalKm !== undefined) {
    if (typeof body.intervalKm !== 'number' || body.intervalKm <= 0)
      throw makeError(400, 'intervalKm must be a positive number');
    if (body.dueKm === undefined) throw makeError(400, 'intervalKm requires dueKm');
  }
}

function assertValidObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw makeError(404, 'Reminder not found');
}

function serialize(reminder, currentKm) {
  const obj = reminder.toJSON ? reminder.toJSON() : reminder;
  obj.status = computeStatus(reminder, currentKm);
  return obj;
}

async function createReminder(userId, body) {
  validateCreateBody(body);
  return reminderModel.create({
    userId,
    type: body.type,
    title: body.title,
    dueDate: body.dueDate,
    dueKm: body.dueKm,
    intervalMonths: body.intervalMonths,
    intervalKm: body.intervalKm,
  });
}

async function listReminders(userId, query) {
  const user = await userModel.findById(userId);
  const currentKm = user?.currentKm || 0;
  const all = await reminderModel.findByUserId(userId);
  const decorated = all.map((r) => serialize(r, currentKm));
  const status = query.status || 'active';
  if (status === 'active') return decorated.filter((r) => r.status !== 'done');
  if (['upcoming', 'dueSoon', 'overdue', 'done'].includes(status))
    return decorated.filter((r) => r.status === status);
  return decorated;
}

async function getReminder(userId, id) {
  assertValidObjectId(id);
  const r = await reminderModel.findById(id);
  if (!r || r.userId.toString() !== userId) throw makeError(404, 'Reminder not found');
  const user = await userModel.findById(userId);
  return serialize(r, user?.currentKm || 0);
}

module.exports = {
  computeStatus, LEAD_DAYS, LEAD_KM,
  createReminder, listReminders, getReminder,
};
