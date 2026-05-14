'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authMiddleware = require('../../../src/middleware/auth.middleware');
const authService = require('../../../src/services/auth.service');
const { createExpense, listExpenses } = require('../../../src/services/expenses.service');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const TODAY = new Date().toISOString().slice(0, 10);

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

describe('Auth middleware → service hand-off integration', () => {
  // TC-02-07
  it('should reject request with missing token and not call next', (_, done) => {
    const req = { headers: {} };
    const res = makeRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    setImmediate(() => {
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res._status, 401);
      assert.match(res._body.message, /not provided/i);
      done();
    });
  });

  // TC-02-06
  it('should reject expired token and not call next', (_, done) => {
    const token = jwt.sign({ id: 'fakeid', username: 'testuser' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    setTimeout(() => {
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res._status, 403);
      assert.match(res._body.message, /invalid or expired/i);
      done();
    }, 50);
  });

  it('should decode a valid token and hand off user id to the service layer', async () => {
    const user = await authService.register({ username: 'testuser', password: 'password1', email: 'testuser@example.com' });
    const { token } = await authService.login({ username: 'testuser', password: 'password1' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();

    let nextCalled = false;
    let created;
    let listed;

    await new Promise((resolve, reject) => {
      authMiddleware(req, res, async () => {
        try {
          nextCalled = true;
          created = await createExpense(req.user.id, { category: 'Parking', amount: 5, date: TODAY });
          listed = await listExpenses(req.user.id, {});
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    assert.ok(nextCalled);
    assert.strictEqual(req.user.id, user.id);
    assert.strictEqual(listed.length, 1);
    assert.strictEqual(listed[0].id, created.id);
  });
});
