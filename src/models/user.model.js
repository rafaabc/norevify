const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = {
  findByUsername: (username) => User.findOne({ username }),
  findById: (id) => User.findById(id),
  create: (data) => User.create(data),
  _reset: () => User.deleteMany({}),
};
