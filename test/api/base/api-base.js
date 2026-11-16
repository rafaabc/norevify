'use strict';

const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { assertTestDb } = require('../../helpers/assertTestDb.js');
const { seedUser } = require('../../helpers/seedUser.js');

// Register models with this mongoose instance (no connection needed at require time)
require('../../../lib/models/user.model.js');
require('../../../lib/models/expense.model.js');
require('../../../lib/models/reminder.model.js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Toll', 'Tax', 'Other'];

let authToken = null;
let authUser = null;
let counter = 0;

// Collections holding per-user rows; wiped for every test user in after().
const OWNED_COLLECTIONS = ['expenses', 'reminders', 'vehicles', 'incomes', 'recurringrules'];

// Tracks every userId created by this test suite for cleanup in after()
const createdUserIds = [];

function uniqueUsername(prefix) {
  return `${prefix}_${Date.now()}_${counter++}`;
}

function getToken() {
  return authToken;
}
function getUser() {
  return authUser;
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

// Tracks a user id created outside the helpers below so after() still deletes it.
function trackUserId(id) {
  if (id) createdUserIds.push(id);
}

// Seeds a fresh verified user straight into the test DB and mints its session JWT
// (see test/helpers/seedUser.js); tracks them for cleanup; returns token only. No
// password exists on these users (there is no password sign-in any more).
async function createAndLoginUser(prefix, overrides = {}) {
  const { id, token } = await seedUser(uniqueUsername(prefix), overrides);
  createdUserIds.push(id);
  return token;
}

// Promotes a user to the admin role directly in the DB (bypasses the admin API,
// which has no self-service way to create the first admin).
// Relies on the root before() hook above having
// already opened the shared mongoose connection.
async function promoteToAdmin(userId) {
  const UserM = mongoose.model('User');
  await UserM.findByIdAndUpdate(userId, { role: 'admin' });
}

// Root-suite before() — runs once before all test files.
before(async function () {
  this.timeout(15000);

  assertTestDb(); // never run against the production database

  // Open DB connection first: the primary user is seeded straight into it.
  await mongoose.connect(process.env.MONGODB_URI);

  // Seeding no longer touches the server, so probe it explicitly to keep the
  // "server not running" failure mode readable.
  const health = await request(BASE_URL)
    .get('/api/health')
    .catch(() => null);
  if (!health) {
    throw new Error(
      `API server not reachable at ${BASE_URL}. Run "npm run dev" in a separate terminal before running the API test suite.`,
    );
  }

  const username = uniqueUsername('primary');
  const { id, token } = await seedUser(username);
  createdUserIds.push(id);

  authToken = token;
  authUser = { username, id };
});

// Root-suite after() — deletes only the users (and their expenses) created by this suite.
after(async function () {
  this.timeout(30000);
  try {
    const UserM = mongoose.model('User');
    const db = mongoose.connection.db;

    const oids = createdUserIds.map((id) => new mongoose.Types.ObjectId(id));
    for (const name of OWNED_COLLECTIONS) {
      await db.collection(name).deleteMany({ userId: { $in: oids } });
    }
    await UserM.deleteMany({ _id: { $in: oids } });
  } catch (err) {
    console.warn('[api-base] Cleanup warning:', err.message);
  } finally {
    await Promise.race([
      mongoose.connection.close(true),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  }
});

module.exports = {
  request,
  expect,
  BASE_URL,
  CATEGORIES,
  getToken,
  getUser,
  uniqueUsername,
  authHeader,
  createAndLoginUser,
  trackUserId,
  promoteToAdmin,
};
