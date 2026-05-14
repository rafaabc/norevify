'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const emailService = require('./email.service');

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function register({ username, password, email }) {
  if (!username || !password || !email)
    throw makeError(400, 'username, password and email are required');
  if (!USERNAME_REGEX.test(username))
    throw makeError(400, 'username must be 3-50 characters, alphanumeric and underscores only');
  if (password.length < 8) throw makeError(400, 'password must be at least 8 characters');
  if (password.length > 20) throw makeError(400, 'password must be at most 20 characters');
  if (!EMAIL_REGEX.test(email)) throw makeError(400, 'invalid email format');
  if (await userModel.findByUsername(username)) throw makeError(409, 'username already taken');
  if (await userModel.findByEmail(email)) throw makeError(409, 'email already registered');

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username, password: hash, email });
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

async function changePassword({ username, currentPassword, newPassword }) {
  if (!username || !currentPassword || !newPassword)
    throw makeError(400, 'username, currentPassword and newPassword are required');
  if (newPassword.length < 8) throw makeError(400, 'password must be at least 8 characters');
  if (newPassword.length > 20) throw makeError(400, 'password must be at most 20 characters');
  const user = await userModel.findByUsername(username);
  if (!user) throw makeError(404, 'User not found');
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw makeError(401, 'Invalid credentials');

  const hash = await bcrypt.hash(newPassword, 10);
  await userModel.updatePassword(username, hash);
  return { message: 'Password updated successfully' };
}

async function forgotPassword({ email }, _sendEmail = emailService.sendPasswordResetEmail) {
  if (!email) throw makeError(400, 'email is required');
  const user = await userModel.findByEmail(email);

  if (user) {
    const token = jwt.sign(
      { username: user.username, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.RESET_PASSWORD_EXPIRES_IN || '15m' }
    );
    const resetUrl = `${process.env.FRONTEND_URL || process.env.BASE_URL}/reset-password?token=${token}`;
    await _sendEmail({ to: email, resetUrl });
  }

  return { message: 'If the email exists, a reset link was sent.' };
}

async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) throw makeError(400, 'token and newPassword are required');
  if (newPassword.length < 8) throw makeError(400, 'password must be at least 8 characters');
  if (newPassword.length > 20) throw makeError(400, 'password must be at most 20 characters');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw makeError(401, 'Invalid or expired reset token');
  }

  if (payload.purpose !== 'reset') throw makeError(401, 'Invalid or expired reset token');

  const hash = await bcrypt.hash(newPassword, 10);
  await userModel.updatePassword(payload.username, hash);
  return { message: 'Password updated successfully' };
}

module.exports = { register, login, changePassword, forgotPassword, resetPassword };
