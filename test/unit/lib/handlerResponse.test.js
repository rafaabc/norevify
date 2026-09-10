'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('lib/handlerResponse.mjs errorResponse()', () => {
  it('masks the message for a 500 (no .status)', async () => {
    const { errorResponse } = await import('../../../lib/handlerResponse.mjs');

    const err = new Error('MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017');
    const report = (e, ctx) => {
      assert.strictEqual(e, err);
      assert.deepStrictEqual(ctx, { route: '/api/expenses' });
      return 500;
    };
    const res = errorResponse(err, { route: '/api/expenses' }, report);
    const body = await res.json();

    assert.strictEqual(res.status, 500);
    assert.deepStrictEqual(body, { message: 'Internal server error' });
  });

  it('masks the message for an explicit 5xx status', async () => {
    const { errorResponse } = await import('../../../lib/handlerResponse.mjs');

    const err = new Error('billing_not_configured');
    err.status = 502;
    const res = errorResponse(err, { route: '/api/billing/webhook' }, () => 502);
    const body = await res.json();

    assert.strictEqual(res.status, 502);
    assert.deepStrictEqual(body, { message: 'Internal server error' });
  });

  it('keeps the original message for a 4xx status', async () => {
    const { errorResponse } = await import('../../../lib/handlerResponse.mjs');

    const err = new Error('Fuel expenses cannot set amount directly');
    err.status = 400;
    const res = errorResponse(err, { route: '/api/expenses' }, () => 400);
    const body = await res.json();

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(body, { message: 'Fuel expenses cannot set amount directly' });
  });

  it('defaults to reportHandlerError when no override is given (real 4xx path)', async () => {
    const { errorResponse } = await import('../../../lib/handlerResponse.mjs');

    const err = new Error('Reminder not found');
    err.status = 404;
    const res = errorResponse(err, { route: '/api/reminders/[id]' });
    const body = await res.json();

    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(body, { message: 'Reminder not found' });
  });
});
