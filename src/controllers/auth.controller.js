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
    const result = await authService.changePassword({
      ...req.body,
      username: req.user.username,
    });
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

async function updateCurrency(req, res) {
  try {
    const result = await authService.updateCurrency({ id: req.user.id, currency: req.body.currency });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function updateLanguage(req, res) {
  try {
    const result = await authService.updateLanguage({ id: req.user.id, language: req.body.language });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function googleLogin(req, res) {
  try {
    const result = await authService.googleLogin(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function linkGoogle(req, res) {
  try {
    const result = await authService.linkGoogle({ userId: req.user.id, idToken: req.body.idToken });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function unlinkGoogle(req, res) {
  try {
    const result = await authService.unlinkGoogle({ userId: req.user.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function getProviders(req, res) {
  try {
    const result = await authService.getProviders({ userId: req.user.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { register, login, changePassword, forgotPassword, resetPassword, updateCurrency, updateLanguage, googleLogin, linkGoogle, unlinkGoogle, getProviders };
