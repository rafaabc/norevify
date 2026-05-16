'use strict';

const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/user.model');

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub, email, email_verified, name } = ticket.getPayload();
    return { sub, email, emailVerified: email_verified, name };
  } catch {
    throw makeError(401, 'Invalid Google token');
  }
}

async function generateUsernameFromEmail(email) {
  const base = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 44)
    .padEnd(3, '_');

  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}_${i}`;
    const existing = await userModel.findByUsername(candidate);
    if (!existing) return candidate;
  }

  const suffix = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
  return `${base.slice(0, 43)}_${suffix}`;
}

module.exports = { verifyIdToken, generateUsernameFromEmail };
