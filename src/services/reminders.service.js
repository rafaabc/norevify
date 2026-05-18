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

module.exports = { computeStatus, LEAD_DAYS, LEAD_KM };
