'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const expenseModel = require('../models/expense.model');
const reminderModel = require('../models/reminder.model');
const googleAuthService = require('./google-auth.service');
const expensesService = require('./expenses.service');
const remindersService = require('./reminders.service');
const recurringService = require('./recurring.service');
const vehiclesService = require('./vehicles.service');
const incomeService = require('./income.service');
const logger = require('../logger');
const stripeLib = require('../stripe.js');
const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } = require('../constants/currencies');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../constants/languages');
const { POLICY_VERSION } = require('../constants/legal');
const { assertInviteAllowed } = require('../inviteGate');

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// `oiat` (original issued-at) is preserved across refreshToken() calls so the
// 30-day refresh ceiling there measures from the very first login, not from
// the most recent refresh — otherwise a token could be refreshed forever.
function issueToken(user, { oiat } = {}) {
  return jwt.sign(
    {
      // typ: 'access' distinguishes session tokens from any other single-purpose
      // token signed with the same JWT_SECRET — withAuth requires it, so such a
      // token can't be replayed as a session.
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
      // Checked against the DB in withAuth (lib/auth.mjs) on every request —
      // bumped by signOutEverywhere (and when a verified Google identity takes
      // over a never-verified legacy account), so this is how an already-issued
      // token gets revoked before it naturally expires.
      tv: user.tokenVersion ?? 0,
      oiat: oiat ?? Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  );
}

// Google is the only way to sign in or sign up. A new account is created only with
// recorded consent to the current policy (LGPD) — the old password registration
// form was the one place that captured it, so it moved here rather than vanishing.
function assertValidConsent(consent) {
  if (!consent || !consent.policyVersion || !consent.acceptedAt)
    throw makeError(400, 'consent with policyVersion and acceptedAt is required');
  if (consent.policyVersion !== POLICY_VERSION)
    throw makeError(400, 'consent policyVersion does not match current policy');
}

async function googleLogin(
  { idToken, inviteCode, consent, currency, ip },
  _verifyIdToken = googleAuthService.verifyIdToken,
) {
  if (!idToken) throw makeError(400, 'idToken is required');
  const { sub: googleId, email, emailVerified } = await _verifyIdToken(idToken);

  let user = await userModel.findByGoogleId(googleId);
  if (user) {
    await userModel.setLastLoginAt(user._id);
    return { token: issueToken(user) };
  }

  // Past this point the Google identity is matched (or bound) by email, so the
  // email claim must be proven — an unverified one would let anyone holding such a
  // token sign into, or claim, the account that owns that address.
  if (emailVerified !== true) throw makeError(401, 'Invalid Google token');

  user = await userModel.findByEmail(email);
  if (user) {
    // Pre-account-hijacking: an account registered with this email but never verified
    // may have been created by someone else. The verified Google owner takes it over,
    // so every session issued before now is revoked.
    if (!user.emailVerified) await userModel.bumpTokenVersion(user._id);
    await userModel.linkGoogleId(user._id, googleId);
    await userModel.setEmailVerified(user._id);
    await userModel.setLastLoginAt(user._id);
    user = await userModel.findById(user._id);
    return { token: issueToken(user) };
  }

  assertValidConsent(consent);
  if (currency !== undefined && !SUPPORTED_CURRENCIES.includes(currency))
    throw makeError(400, `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);
  assertInviteAllowed(inviteCode);

  const ipHash = crypto
    .createHash('sha256')
    .update(ip || '')
    .digest('hex')
    .slice(0, 16);
  const username = await googleAuthService.generateUsernameFromEmail(email);
  user = await userModel.create({
    username,
    email,
    googleId,
    currency: currency || DEFAULT_CURRENCY,
    emailVerified: true,
    consent: {
      policyVersion: consent.policyVersion,
      acceptedAt: new Date(consent.acceptedAt),
      ipHash,
    },
  });
  await userModel.setLastLoginAt(user._id);
  return { token: issueToken(user) };
}

// Revokes every access token issued so far (this device included): withAuth
// rejects any token whose `tv` no longer matches the user's tokenVersion.
async function signOutEverywhere({ userId }) {
  const user = await userModel.findById(userId);
  if (!user) throw makeError(404, 'User not found');
  await userModel.bumpTokenVersion(userId);
  return { message: 'Signed out of all devices' };
}

async function updateCurrency({ id, currency }) {
  if (!currency) throw makeError(400, 'currency is required');
  if (!SUPPORTED_CURRENCIES.includes(currency))
    throw makeError(400, `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);

  const updated = await userModel.updateCurrencyAndReturn(id, currency);
  if (!updated) throw makeError(404, 'User not found');
  return { token: issueToken(updated) };
}

async function updateLanguage({ id, language }) {
  if (!language) throw makeError(400, 'language is required');
  if (!SUPPORTED_LANGUAGES.includes(language))
    throw makeError(400, `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`);

  const updated = await userModel.updateLanguageAndReturn(id, language);
  if (!updated) throw makeError(404, 'User not found');
  return { token: issueToken(updated) };
}

async function updateNotificationPrefs({ id, reminderEmailsEnabled }) {
  if (typeof reminderEmailsEnabled !== 'boolean')
    throw makeError(400, 'reminderEmailsEnabled must be a boolean');

  const updated = await userModel.updateReminderEmailsEnabledAndReturn(id, reminderEmailsEnabled);
  if (!updated) throw makeError(404, 'User not found');
  return { token: issueToken(updated) };
}

async function updateProfitTarget({ id, targetHourlyRate }) {
  if (targetHourlyRate !== null) {
    if (typeof targetHourlyRate !== 'number' || Number.isNaN(targetHourlyRate))
      throw makeError(400, 'targetHourlyRate must be a number or null');
    if (targetHourlyRate < 0)
      throw makeError(400, 'targetHourlyRate must be a non-negative number');
  }

  const updated = await userModel.updateTargetHourlyRateAndReturn(id, targetHourlyRate);
  if (!updated) throw makeError(404, 'User not found');
  return { token: issueToken(updated) };
}

async function updateOdometer({ id, currentKm }) {
  if (currentKm === undefined || currentKm === null) throw makeError(400, 'currentKm is required');
  if (typeof currentKm !== 'number' || currentKm < 0)
    throw makeError(400, 'currentKm must be a non-negative number');

  const user = await userModel.findById(id);
  if (!user) throw makeError(404, 'User not found');
  const updated = await userModel.updateOdometerAndReturn(id, currentKm);
  return { token: issueToken(updated), currentKm: updated.currentKm };
}

// A refreshed token still carries the original oiat, so this caps the total
// session lifetime from first login regardless of how many times it's renewed.
const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

async function refreshToken({ id, oiat }) {
  const user = await userModel.findById(id);
  if (!user) throw makeError(404, 'User not found');

  // Tokens issued before this field existed carry no oiat — treat that as
  // starting the 30-day window now rather than failing every pre-existing
  // session closed the moment this deploys.
  const originalIat = typeof oiat === 'number' ? oiat : Math.floor(Date.now() / 1000);
  if (Math.floor(Date.now() / 1000) - originalIat > REFRESH_MAX_AGE_SECONDS) {
    throw makeError(401, 'Invalid or expired token');
  }

  return { token: issueToken(user, { oiat: originalIat }) };
}

async function exportUserData({ userId }) {
  const user = await userModel.findById(userId);
  if (!user) throw makeError(404, 'User not found');

  const expenses = await expenseModel.findByUserId(userId);
  const reminders = await reminderModel.findByUserId(userId);

  return {
    user: {
      username: user.username,
      email: user.email,
      currency: user.currency,
      language: user.language,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    expenses,
    reminders,
  };
}

// Deleting an account is irreversible, so a stolen session token alone must not be
// enough: the caller re-proves control of the Google account by presenting a fresh
// ID token whose subject matches the account's linked Google identity.
async function deleteAccount(
  { userId, idToken },
  _verifyIdToken = googleAuthService.verifyIdToken,
) {
  const user = await userModel.findById(userId);
  if (!user) throw makeError(404, 'User not found');

  if (!idToken) throw makeError(400, 'idToken is required');
  const { sub } = await _verifyIdToken(idToken);
  if (!user.googleId || sub !== user.googleId) throw makeError(401, 'Invalid credentials');

  try {
    await remindersService.deleteAllByUser(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete reminders');
    throw err;
  }

  try {
    await expensesService.deleteAllByUser(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete expenses');
    throw err;
  }

  try {
    await recurringService.deleteAllByUser(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete recurring rules');
    throw err;
  }

  try {
    await incomeService.deleteAllByUser(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete income');
    throw err;
  }

  try {
    await vehiclesService.deleteAllByUser(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete vehicles');
    throw err;
  }

  if (user.stripeSubscriptionId) {
    try {
      const stripe = stripeLib.getStripe();
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      logger.error({ err, userId }, 'deleteAccount: failed to cancel Stripe subscription');
      throw err;
    }
  }

  try {
    await userModel.deleteById(userId);
  } catch (err) {
    logger.error({ err, userId }, 'deleteAccount: failed to delete user');
    throw err;
  }
}

module.exports = {
  googleLogin,
  signOutEverywhere,
  updateCurrency,
  updateLanguage,
  updateNotificationPrefs,
  updateProfitTarget,
  updateOdometer,
  refreshToken,
  exportUserData,
  deleteAccount,
};
