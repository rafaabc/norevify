const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function register({ username, password }) {
  if (!username || !password) throw makeError(400, 'username and password are required');
  if (!USERNAME_REGEX.test(username))
    throw makeError(400, 'username must be 3-50 characters, alphanumeric and underscores only');
  if (password.length < 8) throw makeError(400, 'password must be at least 8 characters');
  if (password.length > 20) throw makeError(400, 'password must be at most 20 characters');
  if (await userModel.findByUsername(username)) throw makeError(409, 'username already taken');

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username, password: hash });
  return { id: user._id.toString(), username: user.username };
}

async function login({ username, password }) {
  if (!username || !password) throw makeError(400, 'username and password are required');
  const user = await userModel.findByUsername(username);
  if (!user) throw makeError(401, 'Invalid credentials');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw makeError(401, 'Invalid credentials');

  const token = jwt.sign(
    { id: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  return { token };
}

async function changePassword({ username, newPassword }) {
  if (!username || !newPassword) throw makeError(400, 'username and newPassword are required');
  if (newPassword.length < 8) throw makeError(400, 'password must be at least 8 characters');
  if (newPassword.length > 20) throw makeError(400, 'password must be at most 20 characters');
  const user = await userModel.findByUsername(username);
  if (!user) throw makeError(404, 'User not found');

  const hash = await bcrypt.hash(newPassword, 10);
  await userModel.updatePassword(username, hash);
  return { message: 'Password updated successfully' };
}

module.exports = { register, login, changePassword };
