'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { clampDayOfMonth, occurrencesDue } = require('../../lib/recurrence.js');

// Helper: build a Date from a YYYY-MM-DD string at UTC midnight
function d(str) {
  const [y, m, day] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

describe('clampDayOfMonth()', () => {
  it('returns the day unchanged when within range', () => {
    assert.strictEqual(clampDayOfMonth(2024, 3, 15), 15); // March has 31 days
  });

  it('clamps 31 to 28 for February in a non-leap year', () => {
    assert.strictEqual(clampDayOfMonth(2023, 2, 31), 28);
  });

  it('clamps 31 to 29 for February in a leap year', () => {
    assert.strictEqual(clampDayOfMonth(2024, 2, 31), 29);
  });

  it('clamps 31 to 30 for April', () => {
    assert.strictEqual(clampDayOfMonth(2024, 4, 31), 30);
  });
});

describe('occurrencesDue()', () => {
  const base = {
    startDate: d('2024-01-15'),
    interval: 1,
    dayOfMonth: 15,
    lastGeneratedDate: null,
  };

  it('returns empty array when startDate is in the future', () => {
    const today = d('2024-01-14');
    const result = occurrencesDue(base, today);
    assert.deepStrictEqual(result, []);
  });

  it('returns one occurrence when today equals startDate', () => {
    const today = d('2024-01-15');
    const result = occurrencesDue(base, today);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].getTime(), today.getTime());
  });

  it('returns multiple occurrences for a monthly rule over 3 months', () => {
    const today = d('2024-03-15');
    const result = occurrencesDue(base, today);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].getTime(), d('2024-01-15').getTime());
    assert.strictEqual(result[1].getTime(), d('2024-02-15').getTime());
    assert.strictEqual(result[2].getTime(), d('2024-03-15').getTime());
  });

  it('is idempotent: second run after advancing lastGeneratedDate returns empty', () => {
    const today = d('2024-01-15');
    const rule = { ...base, lastGeneratedDate: d('2024-01-15') };
    const result = occurrencesDue(rule, today);
    assert.deepStrictEqual(result, []);
  });

  it('only returns occurrences after lastGeneratedDate', () => {
    const today = d('2024-03-15');
    const rule = { ...base, lastGeneratedDate: d('2024-01-15') };
    const result = occurrencesDue(rule, today);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].getTime(), d('2024-02-15').getTime());
    assert.strictEqual(result[1].getTime(), d('2024-03-15').getTime());
  });

  it('clamps day 31 correctly in February (non-leap)', () => {
    const rule = {
      startDate: d('2023-01-31'),
      interval: 1,
      dayOfMonth: 31,
      lastGeneratedDate: null,
    };
    const today = d('2023-03-31');
    const result = occurrencesDue(rule, today);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].getTime(), d('2023-01-31').getTime());
    assert.strictEqual(result[1].getTime(), d('2023-02-28').getTime()); // clamped
    assert.strictEqual(result[2].getTime(), d('2023-03-31').getTime());
  });

  it('returns correct occurrences for 6-month interval', () => {
    const rule = {
      startDate: d('2024-01-01'),
      interval: 6,
      dayOfMonth: 1,
      lastGeneratedDate: null,
    };
    const today = d('2025-01-01');
    const result = occurrencesDue(rule, today);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].getTime(), d('2024-01-01').getTime());
    assert.strictEqual(result[1].getTime(), d('2024-07-01').getTime());
    assert.strictEqual(result[2].getTime(), d('2025-01-01').getTime());
  });

  it('returns correct occurrences for 12-month interval', () => {
    const rule = {
      startDate: d('2023-06-01'),
      interval: 12,
      dayOfMonth: 1,
      lastGeneratedDate: null,
    };
    const today = d('2025-06-01');
    const result = occurrencesDue(rule, today);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].getTime(), d('2023-06-01').getTime());
    assert.strictEqual(result[1].getTime(), d('2024-06-01').getTime());
    assert.strictEqual(result[2].getTime(), d('2025-06-01').getTime());
  });
});
