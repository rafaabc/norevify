'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const authService    = require('../../../src/services/auth.service');
const authController = require('../../../src/controllers/auth.controller');

// Minimal req/res fakes
function makeRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body  = body;  return res; };
  res.send   = ()      => res;
  return res;
}

afterEach(() => mock.restoreAll());

describe('authController.register()', () => {
  it('should respond 201 with service result on success', async () => {
    mock.method(authService, 'register', async () => ({ id: 'abc', username: 'alice' }));
    const req = { body: { username: 'alice', password: 'Pass1234', email: 'a@b.com' } };
    const res = makeRes();
    await authController.register(req, res);
    assert.strictEqual(res._status, 201);
    assert.deepStrictEqual(res._body, { id: 'abc', username: 'alice' });
  });

  it('should respond with service error status and message on failure', async () => {
    const err = Object.assign(new Error('username already taken'), { status: 409 });
    mock.method(authService, 'register', async () => { throw err; });
    const req = { body: {} };
    const res = makeRes();
    await authController.register(req, res);
    assert.strictEqual(res._status, 409);
    assert.strictEqual(res._body.message, 'username already taken');
  });

  it('should fall back to 500 when error has no status property', async () => {
    mock.method(authService, 'register', async () => { throw new Error('unexpected'); });
    const req = { body: {} };
    const res = makeRes();
    await authController.register(req, res);
    assert.strictEqual(res._status, 500);
  });
});

describe('authController.login()', () => {
  it('should respond 200 with token on success', async () => {
    mock.method(authService, 'login', async () => ({ token: 'jwt-token' }));
    const req = { body: { username: 'alice', password: 'Pass1234' } };
    const res = makeRes();
    await authController.login(req, res);
    assert.strictEqual(res._status, 200);
    assert.deepStrictEqual(res._body, { token: 'jwt-token' });
  });

  it('should respond 401 on invalid credentials', async () => {
    const err = Object.assign(new Error('Invalid credentials'), { status: 401 });
    mock.method(authService, 'login', async () => { throw err; });
    const req = { body: {} };
    const res = makeRes();
    await authController.login(req, res);
    assert.strictEqual(res._status, 401);
  });
});

describe('authController.changePassword()', () => {
  it('should respond 200 with success message', async () => {
    mock.method(authService, 'changePassword', async () => ({ message: 'Password updated successfully' }));
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' }, user: { username: 'alice' } };
    const res = makeRes();
    await authController.changePassword(req, res);
    assert.strictEqual(res._status, 200);
    assert.match(res._body.message, /updated/i);
  });

  it('should merge req.user.username into the service call', async () => {
    let calledWith;
    mock.method(authService, 'changePassword', async (args) => { calledWith = args; return { message: 'ok' }; });
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' }, user: { username: 'alice' } };
    const res = makeRes();
    await authController.changePassword(req, res);
    assert.strictEqual(calledWith.username, 'alice');
  });

  it('should respond 401 when old password is wrong', async () => {
    const err = Object.assign(new Error('Invalid credentials'), { status: 401 });
    mock.method(authService, 'changePassword', async () => { throw err; });
    const req = { body: {}, user: { username: 'alice' } };
    const res = makeRes();
    await authController.changePassword(req, res);
    assert.strictEqual(res._status, 401);
  });
});

describe('authController.forgotPassword()', () => {
  it('should respond 200 with safe message regardless of email existence', async () => {
    mock.method(authService, 'forgotPassword', async () => ({ message: 'If the email exists, a reset link was sent.' }));
    const req = { body: { email: 'any@example.com' } };
    const res = makeRes();
    await authController.forgotPassword(req, res);
    assert.strictEqual(res._status, 200);
    assert.match(res._body.message, /reset link/i);
  });

  it('should respond 400 when email is missing', async () => {
    const err = Object.assign(new Error('email is required'), { status: 400 });
    mock.method(authService, 'forgotPassword', async () => { throw err; });
    const req = { body: {} };
    const res = makeRes();
    await authController.forgotPassword(req, res);
    assert.strictEqual(res._status, 400);
  });
});

describe('authController.resetPassword()', () => {
  it('should respond 200 with success message on valid token', async () => {
    mock.method(authService, 'resetPassword', async () => ({ message: 'Password updated successfully' }));
    const req = { body: { token: 'valid.jwt.token', newPassword: 'NewPass99' } };
    const res = makeRes();
    await authController.resetPassword(req, res);
    assert.strictEqual(res._status, 200);
    assert.match(res._body.message, /updated/i);
  });

  it('should respond 401 when token is invalid or expired', async () => {
    const err = Object.assign(new Error('Invalid or expired reset token'), { status: 401 });
    mock.method(authService, 'resetPassword', async () => { throw err; });
    const req = { body: { token: 'bad-token', newPassword: 'NewPass99' } };
    const res = makeRes();
    await authController.resetPassword(req, res);
    assert.strictEqual(res._status, 401);
  });

  it('should respond 400 when newPassword is too short', async () => {
    const err = Object.assign(new Error('password must be at least 8 characters'), { status: 400 });
    mock.method(authService, 'resetPassword', async () => { throw err; });
    const req = { body: { token: 'tok', newPassword: '1234' } };
    const res = makeRes();
    await authController.resetPassword(req, res);
    assert.strictEqual(res._status, 400);
  });
});
