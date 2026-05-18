const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } = require('../constants/currencies');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../constants/languages');

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true },
  password:      { type: String, required: false },
  email:         { type: String, required: true, unique: true },
  currency:      { type: String, enum: SUPPORTED_CURRENCIES, default: DEFAULT_CURRENCY },
  language:      { type: String, enum: SUPPORTED_LANGUAGES, default: DEFAULT_LANGUAGE },
  googleId:      { type: String, unique: true, sparse: true },
  authProviders:       { type: [String], default: ['password'], enum: ['password', 'google'] },
  currentKm:           { type: Number, default: 0, min: 0 },
  currentKmUpdatedAt:  { type: Date },
});

const User = mongoose.model('User', userSchema);

module.exports = {
  findByUsername:  (username) => User.findOne({ username }),
  findByEmail:     (email)    => User.findOne({ email }),
  findById:        (id)       => User.findById(id),
  findByGoogleId:  (googleId) => User.findOne({ googleId }),
  create: (data) => User.create(data),
  updatePassword: (username, hashedPassword) =>
    User.updateOne({ username }, { $set: { password: hashedPassword } }),
  updateCurrency: (id, currency) =>
    User.updateOne({ _id: id }, { $set: { currency } }),
  updateLanguage: (id, language) =>
    User.updateOne({ _id: id }, { $set: { language } }),
  updateCurrencyAndReturn: (id, currency) =>
    User.findOneAndUpdate({ _id: id }, { $set: { currency } }, { returnDocument: 'after' }),
  updateLanguageAndReturn: (id, language) =>
    User.findOneAndUpdate({ _id: id }, { $set: { language } }, { returnDocument: 'after' }),
  linkGoogleId: (userId, googleId) =>
    User.updateOne({ _id: userId }, { $set: { googleId }, $addToSet: { authProviders: 'google' } }),
  unlinkGoogleId: (userId) =>
    User.updateOne({ _id: userId }, { $unset: { googleId: '' }, $pull: { authProviders: 'google' } }),
  updateOdometerAndReturn: (id, currentKm) =>
    User.findOneAndUpdate(
      { _id: id },
      { $set: { currentKm, currentKmUpdatedAt: new Date() } },
      { returnDocument: 'after' }
    ),
  _reset: () => User.deleteMany({}),
};
