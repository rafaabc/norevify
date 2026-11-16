'use strict';

// Test-only user bootstrap for test:api and e2e. Inserts a user straight into the
// `_test` Mongo database and mints the session JWT locally, instead of driving
// POST /register + POST /login. That keeps the suites independent of the password
// path (rate limit, lockout, zxcvbn/HIBP, bcrypt) and of any real Google sign-in,
// which CI cannot automate.
//
// Deliberately NOT an HTTP route: a "test login" endpoint would be a backdoor in
// production if a flag ever leaked. This helper needs JWT_SECRET + a MONGODB_URI
// that passes assertTestDb(), both only present in the test environment.

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const userModel = require('../../lib/models/user.model.js');
const { assertTestDb } = require('./assertTestDb.js');
const { DEFAULT_CURRENCY } = require('../../lib/constants/currencies');
const { DEFAULT_LANGUAGE } = require('../../lib/constants/languages');

async function ensureConnected() {
  assertTestDb();
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
}

// Mirrors issueToken() in lib/services/auth.service.js. The two must stay in sync:
// test/unit/seedUser.test.js compares their claim sets so drift fails loudly.
function signSessionToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('seedUser: JWT_SECRET is not set');
  return jwt.sign(
    {
      typ: 'access',
      id: user._id.toString(),
      username: user.username,
      currency: user.currency || DEFAULT_CURRENCY,
      language: user.language || DEFAULT_LANGUAGE,
      emailVerified: user.emailVerified === true,
      plan: user.plan || 'free',
      role: user.role || 'user',
      reminderEmailsEnabled: user.reminderEmailsEnabled !== false,
      targetHourlyRate: user.targetHourlyRate ?? null,
      tv: user.tokenVersion ?? 0,
      oiat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  );
}

/**
 * Creates a verified, password-less user linked to a synthetic Google identity. `overrides` lets a test
 * set fields such as `role`, `plan`, `language` or `currency` up front.
 * @param {string} username
 * @param {Record<string, unknown>} [overrides]
 * @returns {Promise<{ id: string, username: string, email: string, token: string }>}
 */
async function seedUser(username, overrides = {}) {
  await ensureConnected();
  const user = await userModel.create({
    username,
    email: `${username}@test.com`,
    googleId: `seed_${username}`,
    emailVerified: true,
    ...overrides,
  });
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    token: signSessionToken(user),
  };
}

/**
 * Mints a fresh session JWT for an existing user from its CURRENT database state,
 * the way a real login would (language, plan, role and tokenVersion all reflect
 * whatever earlier steps changed). Use it instead of reusing a token minted at
 * seed time when a test mutates the account and then signs in again.
 * @param {string} username
 * @returns {Promise<string>}
 */
async function tokenFor(username) {
  await ensureConnected();
  const user = await userModel.findByUsername(username);
  if (!user) throw new Error(`tokenFor: no user "${username}" in the test database`);
  return signSessionToken(user);
}

module.exports = { seedUser, signSessionToken, tokenFor };
