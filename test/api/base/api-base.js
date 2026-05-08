'use strict';

const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

// Register models with this mongoose instance (no connection needed at require time)
require('../../../src/models/user.model.js');
require('../../../src/models/expense.model.js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Toll', 'Tax', 'Other'];

let authToken = null;
let authUser = null;
let counter = 0;

// Tracks every userId created by this test suite for cleanup in after()
const createdUserIds = [];

function uniqueUsername(prefix) {
  return `${prefix}_${Date.now()}_${counter++}`;
}

function getToken() { return authToken; }
function getUser()  { return authUser; }

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

// Registers a user, tracks their ID for cleanup, returns the full supertest response.
async function registerAndTrack(username, password) {
  const res = await request(BASE_URL)
    .post('/api/auth/register')
    .send({ username, password });

  if (res.status === 201 && res.body.id) {
    createdUserIds.push(res.body.id);
  }
  return res;
}

// Registers + logs in a fresh user; tracks them for cleanup; returns token only.
async function createAndLoginUser(prefix) {
  const username = uniqueUsername(prefix);
  const password = 'Password1';

  const regRes = await request(BASE_URL)
    .post('/api/auth/register')
    .send({ username, password });

  if (regRes.status === 201 && regRes.body.id) {
    createdUserIds.push(regRes.body.id);
  }

  const loginRes = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ username, password });

  return loginRes.body.token;
}

// Root-suite before() — runs once before all test files.
before(async function () {
  this.timeout(15000);

  const username = uniqueUsername('primary');
  const password = 'Password1';

  const regRes = await request(BASE_URL)
    .post('/api/auth/register')
    .send({ username, password })
    .catch(() => null);

  if (!regRes) {
    throw new Error(
      `API server not reachable at ${BASE_URL}. Run "npm run dev" in a separate terminal before running the API test suite.`
    );
  }

  expect(regRes.status, 'primary user registration failed').to.equal(201);

  const loginRes = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ username, password });

  expect(loginRes.status, 'primary user login failed').to.equal(200);

  authToken = loginRes.body.token;
  authUser = { username, password, id: regRes.body.id };
  createdUserIds.push(regRes.body.id);

  // Open a direct DB connection for teardown cleanup
  await mongoose.connect(process.env.MONGODB_URI);
});

// Root-suite after() — deletes only the users (and their expenses) created by this suite.
after(async function () {
  this.timeout(15000);
  try {
    const UserM    = mongoose.model('User');
    const ExpenseM = mongoose.model('Expense');

    for (const id of createdUserIds) {
      const oid = new mongoose.Types.ObjectId(id);
      await ExpenseM.deleteMany({ userId: oid });
      await UserM.findByIdAndDelete(oid);
    }
  } catch (err) {
    console.warn('[api-base] Cleanup warning:', err.message);
  } finally {
    await mongoose.disconnect();
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
  registerAndTrack,
};
