const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } = require('../constants/currencies');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  currency: { type: String, enum: SUPPORTED_CURRENCIES, default: DEFAULT_CURRENCY },
});

const User = mongoose.model('User', userSchema);

module.exports = {
  findByUsername: (username) => User.findOne({ username }),
  findByEmail:    (email)    => User.findOne({ email }),
  findById:       (id)       => User.findById(id),
  create: (data) => User.create(data),
  updatePassword: (username, hashedPassword) =>
    User.updateOne({ username }, { $set: { password: hashedPassword } }),
  updateCurrency: (id, currency) =>
    User.updateOne({ _id: id }, { $set: { currency } }),
  _reset: () => User.deleteMany({}),
};
