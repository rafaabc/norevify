'use strict';

const MONEY_DECIMALS = 2;
// Float noise tolerance: 4.35 * 100 is 434.99999999999994, so compare against a hair
// rather than exactly.
const EPSILON = 1e-6;

// Validates a money amount sent by a client: a finite number, positive (or non-negative
// with allowZero), with at most two decimal places. Rejects rather than rounds, so the
// stored value is always what the user typed. Throws a 400 error like the other
// validators (see validateFreeText.js).
function assertMoney(field, value, { allowZero = false } = {}) {
  const kind = allowZero ? 'a non-negative number' : 'a positive number';
  let message;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    message = `${field} must be ${kind}`;
  } else if (allowZero ? value < 0 : value <= 0) {
    message = `${field} must be ${kind}`;
  } else {
    const scaled = value * 10 ** MONEY_DECIMALS;
    if (Math.abs(scaled - Math.round(scaled)) > EPSILON) {
      message = `${field} must have at most ${MONEY_DECIMALS} decimal places`;
    }
  }
  if (message) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
}

module.exports = { assertMoney, MONEY_DECIMALS };
