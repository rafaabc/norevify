'use strict';

const userModel = require('../../lib/models/user.model');

// Creates a user straight through the model and returns { id, username }. There is no
// password sign-up any more, so flow/unit tests that only need an existing account
// build one here. `password` and `consent` are accepted and ignored so older fixtures
// keep working unchanged.
async function createUser({ username, email, password: _password, consent: _consent, ...rest }) {
  const user = await userModel.create({ username, email, emailVerified: true, ...rest });
  return { id: user._id.toString(), username: user.username };
}

module.exports = { createUser };
