'use strict';

const { describe, it, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const expensesService    = require('../../../src/services/expenses.service');
const expensesController = require('../../../src/controllers/expenses.controller');

function makeRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body  = body;  return res; };
  res.send   = ()      => res;
  return res;
}

const USER_ID = 'user123';
const EXPENSE  = { _id: 'exp1', category: 'Fuel', amount: 50, date: '2024-01-01' };

afterEach(() => mock.restoreAll());

describe('expensesController.create()', () => {
  it('should respond 201 with the created expense', async () => {
    mock.method(expensesService, 'createExpense', async () => EXPENSE);
    const req = { user: { id: USER_ID }, body: { category: 'Fuel', litres: 10, price_per_litre: 5, date: '2024-01-01' } };
    const res = makeRes();
    await expensesController.create(req, res);
    assert.strictEqual(res._status, 201);
    assert.deepStrictEqual(res._body, EXPENSE);
  });

  it('should respond 400 on validation error', async () => {
    const err = Object.assign(new Error('litres is required for Fuel'), { status: 400 });
    mock.method(expensesService, 'createExpense', async () => { throw err; });
    const req = { user: { id: USER_ID }, body: {} };
    const res = makeRes();
    await expensesController.create(req, res);
    assert.strictEqual(res._status, 400);
    assert.match(res._body.message, /litres/i);
  });

  it('should fall back to 500 when error has no status', async () => {
    mock.method(expensesService, 'createExpense', async () => { throw new Error('db crash'); });
    const req = { user: { id: USER_ID }, body: {} };
    const res = makeRes();
    await expensesController.create(req, res);
    assert.strictEqual(res._status, 500);
  });
});

describe('expensesController.list()', () => {
  it('should respond 200 with expense array', async () => {
    mock.method(expensesService, 'listExpenses', async () => [EXPENSE]);
    const req = { user: { id: USER_ID }, query: {} };
    const res = makeRes();
    await expensesController.list(req, res);
    assert.strictEqual(res._status, 200);
    assert.deepStrictEqual(res._body, [EXPENSE]);
  });

  it('should pass query filters to the service', async () => {
    let calledWith;
    mock.method(expensesService, 'listExpenses', async (id, q) => { calledWith = { id, q }; return []; });
    const req = { user: { id: USER_ID }, query: { category: 'Fuel', year: '2024' } };
    const res = makeRes();
    await expensesController.list(req, res);
    assert.strictEqual(calledWith.id, USER_ID);
    assert.strictEqual(calledWith.q.category, 'Fuel');
  });
});

describe('expensesController.summary()', () => {
  it('should respond 200 with summary data', async () => {
    const summary = { total: 100, byCategory: {} };
    mock.method(expensesService, 'getSummary', async () => summary);
    const req = { user: { id: USER_ID }, query: { year: '2024' } };
    const res = makeRes();
    await expensesController.summary(req, res);
    assert.strictEqual(res._status, 200);
    assert.deepStrictEqual(res._body, summary);
  });

  it('should respond 400 when year is missing', async () => {
    const err = Object.assign(new Error('year is required'), { status: 400 });
    mock.method(expensesService, 'getSummary', async () => { throw err; });
    const req = { user: { id: USER_ID }, query: {} };
    const res = makeRes();
    await expensesController.summary(req, res);
    assert.strictEqual(res._status, 400);
  });
});

describe('expensesController.getOne()', () => {
  it('should respond 200 with the expense', async () => {
    mock.method(expensesService, 'getExpense', async () => EXPENSE);
    const req = { user: { id: USER_ID }, params: { id: 'exp1' } };
    const res = makeRes();
    await expensesController.getOne(req, res);
    assert.strictEqual(res._status, 200);
    assert.deepStrictEqual(res._body, EXPENSE);
  });

  it('should respond 404 when expense does not exist', async () => {
    const err = Object.assign(new Error('Expense not found'), { status: 404 });
    mock.method(expensesService, 'getExpense', async () => { throw err; });
    const req = { user: { id: USER_ID }, params: { id: 'nope' } };
    const res = makeRes();
    await expensesController.getOne(req, res);
    assert.strictEqual(res._status, 404);
  });
});

describe('expensesController.update()', () => {
  it('should respond 200 with the updated expense', async () => {
    const updated = { ...EXPENSE, amount: 75 };
    mock.method(expensesService, 'updateExpense', async () => updated);
    const req = { user: { id: USER_ID }, params: { id: 'exp1' }, body: { litres: 15 } };
    const res = makeRes();
    await expensesController.update(req, res);
    assert.strictEqual(res._status, 200);
    assert.deepStrictEqual(res._body, updated);
  });

  it('should respond 403 when expense belongs to another user', async () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 });
    mock.method(expensesService, 'updateExpense', async () => { throw err; });
    const req = { user: { id: 'other' }, params: { id: 'exp1' }, body: {} };
    const res = makeRes();
    await expensesController.update(req, res);
    assert.strictEqual(res._status, 403);
  });
});

describe('expensesController.remove()', () => {
  it('should respond 204 with no body on success', async () => {
    mock.method(expensesService, 'deleteExpense', async () => {});
    const req = { user: { id: USER_ID }, params: { id: 'exp1' } };
    const res = makeRes();
    await expensesController.remove(req, res);
    assert.strictEqual(res._status, 204);
    assert.strictEqual(res._body, undefined);
  });

  it('should respond 404 when expense does not exist', async () => {
    const err = Object.assign(new Error('Expense not found'), { status: 404 });
    mock.method(expensesService, 'deleteExpense', async () => { throw err; });
    const req = { user: { id: USER_ID }, params: { id: 'nope' } };
    const res = makeRes();
    await expensesController.remove(req, res);
    assert.strictEqual(res._status, 404);
  });
});
