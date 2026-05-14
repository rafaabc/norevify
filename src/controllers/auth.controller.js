'use strict';

const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const result = await authService.changePassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { register, login, changePassword, forgotPassword, resetPassword };
