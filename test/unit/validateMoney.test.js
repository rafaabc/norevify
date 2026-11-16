'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { assertMoney } = require('../../lib/validateMoney');

const rejects400 = (fn, pattern) =>
  assert.throws(fn, (err) => err.status === 400 && pattern.test(err.message));

describe('assertMoney()', () => {
  it('accepts positive amounts with up to 2 decimals', () => {
    for (const v of [1, 0.01, 19.99, 250.5, 1234567.89]) {
      assert.doesNotThrow(() => assertMoney('amount', v), `${v} should pass`);
    }
  });

  it('accepts values whose binary float form is not exact', () => {
    // 0.1 + 0.2 === 0.30000000000000004; 1.005 * 100 === 100.49999999999999
    for (const v of [0.1 + 0.2, 1.1, 4.35, 8.2, 33.33]) {
      assert.doesNotThrow(() => assertMoney('amount', v), `${v} should pass`);
    }
  });

  it('rejects more than 2 decimal places', () => {
    for (const v of [19.999, 0.001, 1.005, 5.123]) {
      rejects400(() => assertMoney('amount', v), /amount must have at most 2 decimal places/);
    }
  });

  it('names the field in the decimal-places error', () => {
    rejects400(() => assertMoney('tips', 2.555, { allowZero: true }), /^tips must have at most/);
  });

  it('rejects non-numbers, NaN and Infinity as not a positive number', () => {
    for (const v of ['10', null, undefined, {}, NaN, Infinity, -Infinity]) {
      rejects400(() => assertMoney('amount', v), /amount must be a positive number/);
    }
  });

  it('rejects zero and negatives unless allowZero', () => {
    rejects400(() => assertMoney('amount', 0), /amount must be a positive number/);
    rejects400(() => assertMoney('amount', -5), /amount must be a positive number/);
    assert.doesNotThrow(() => assertMoney('tips', 0, { allowZero: true }));
    rejects400(
      () => assertMoney('tips', -1, { allowZero: true }),
      /tips must be a non-negative number/,
    );
  });
});
