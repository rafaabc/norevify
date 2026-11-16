const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } = require('../constants/currencies');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../constants/languages');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    currency: { type: String, enum: SUPPORTED_CURRENCIES, default: DEFAULT_CURRENCY },
    language: { type: String, enum: SUPPORTED_LANGUAGES, default: DEFAULT_LANGUAGE },
    googleId: { type: String, unique: true, sparse: true },
    currentKm: { type: Number, default: 0, min: 0 },
    currentKmUpdatedAt: { type: Date },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    planSource: { type: String, enum: ['stripe', 'manual'], default: 'stripe' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    stripeSubscriptionId: { type: String },
    stripeSubscriptionStatus: { type: String },
    planRenewsAt: { type: Date },
    lastStripeEventId: { type: String },
    processedStripeEventIds: { type: [String], default: [] },
    reminderEmailsEnabled: { type: Boolean, default: true },
    targetHourlyRate: { type: Number, default: null, min: 0 },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    // Bumped by signOutEverywhere (and when Google takes over an unverified legacy account) — every access
    // token carries the value it was issued with (`tv` claim), and withAuth
    // rejects a request whose `tv` doesn't match the current value. That's how
    // an already-issued token gets invalidated server-side; see lib/auth.mjs
    // and lib/services/auth.service.js. Existing users predate this field, so
    // every comparison must normalize with `?? 0` on both sides.
    tokenVersion: { type: Number, default: 0 },
    consent: {
      policyVersion: { type: String },
      acceptedAt: { type: Date },
      ipHash: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.consent;
        delete ret.tokenVersion;
        delete ret.stripeCustomerId;
        delete ret.stripeSubscriptionId;
        delete ret.lastStripeEventId;
        delete ret.processedStripeEventIds;
        delete ret.__v;
      },
    },
  },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Query-filter values must be primitive strings — passing an object (e.g. `{ $ne: null }`)
// straight into Mongoose's filter lets an attacker inject query operators, and passing
// `undefined` gets dropped during BSON serialization, silently widening the filter to `{}`
// and matching the first document in the collection. Fail closed: skip the query entirely
// for anything that isn't a string.
const findOneByString = (field, value) =>
  typeof value === 'string' ? User.findOne({ [field]: value }) : Promise.resolve(null);

module.exports = {
  findByUsername: (username) => findOneByString('username', username),
  findByEmail: (email) => findOneByString('email', email),
  findById: (id) => User.findById(id),
  findByGoogleId: (googleId) => findOneByString('googleId', googleId),
  create: (data) => User.create(data),
  // Invalidates every access token issued so far: withAuth (lib/auth.mjs) rejects a
  // token whose `tv` claim no longer matches. See auth.service.signOutEverywhere.
  bumpTokenVersion: (id) => User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } }),
  updateCurrency: (id, currency) => User.updateOne({ _id: id }, { $set: { currency } }),
  updateLanguage: (id, language) => User.updateOne({ _id: id }, { $set: { language } }),
  updatePlan: (id, plan) => User.updateOne({ _id: id }, { $set: { plan } }),
  // Manual plan grants (admin surface) also mark planSource so a later Stripe
  // webhook doesn't silently clobber an admin-granted plan — one atomic update
  // beats two separate calls racing each other.
  setPlanManually: (id, plan) =>
    User.updateOne({ _id: id }, { $set: { plan, planSource: 'manual' } }),
  // `eventId`, when passed, records the Stripe event as processed (capped at the
  // most recent 50 ids via $slice) so handleWebhookEvent's idempotency guard can
  // recognize ANY previously-processed event on redelivery, not just the latest one.
  updatePlanAndBilling: (id, fields, eventId) => {
    const update = { $set: fields };
    if (eventId) {
      update.$push = { processedStripeEventIds: { $each: [eventId], $slice: -50 } };
    }
    return User.findOneAndUpdate({ _id: id }, update, { returnDocument: 'after' });
  },
  findByStripeCustomerId: (stripeCustomerId) =>
    findOneByString('stripeCustomerId', stripeCustomerId),
  clearBilling: (id) =>
    User.findOneAndUpdate(
      { _id: id },
      {
        $set: { plan: 'free', planSource: 'stripe' },
        $unset: {
          stripeCustomerId: '',
          stripeSubscriptionId: '',
          stripeSubscriptionStatus: '',
          planRenewsAt: '',
          lastStripeEventId: '',
        },
      },
      { returnDocument: 'after' },
    ),
  updateCurrencyAndReturn: (id, currency) =>
    User.findOneAndUpdate({ _id: id }, { $set: { currency } }, { returnDocument: 'after' }),
  updateLanguageAndReturn: (id, language) =>
    User.findOneAndUpdate({ _id: id }, { $set: { language } }, { returnDocument: 'after' }),
  updateReminderEmailsEnabledAndReturn: (id, reminderEmailsEnabled) =>
    User.findOneAndUpdate(
      { _id: id },
      { $set: { reminderEmailsEnabled } },
      { returnDocument: 'after' },
    ),
  updateTargetHourlyRateAndReturn: (id, targetHourlyRate) =>
    User.findOneAndUpdate({ _id: id }, { $set: { targetHourlyRate } }, { returnDocument: 'after' }),
  findAllForReminderDigest: () =>
    User.find({ emailVerified: true, reminderEmailsEnabled: { $ne: false } }),
  linkGoogleId: (userId, googleId) => User.updateOne({ _id: userId }, { $set: { googleId } }),
  updateOdometerAndReturn: (id, currentKm) =>
    User.findOneAndUpdate(
      { _id: id },
      { $set: { currentKm, currentKmUpdatedAt: new Date() } },
      { returnDocument: 'after' },
    ),
  setEmailVerified: (id) =>
    User.findOneAndUpdate(
      { _id: id },
      { $set: { emailVerified: true } },
      { returnDocument: 'after' },
    ),
  setLastLoginAt: (id) => User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } }),
  deleteById: (id) => User.deleteOne({ _id: id }),
  listForAdmin: () =>
    User.find({}, 'username email plan planSource role createdAt').sort({ createdAt: -1 }),
  updateRole: (id, role) => User.updateOne({ _id: id }, { $set: { role } }),
  _reset: () => User.deleteMany({}),
};
