'use strict';

/**
 * Pure date-math utilities for recurring expense generation.
 * No DB, no side effects — safe to unit-test in isolation.
 *
 * All dates are normalised to UTC midnight so the logic is timezone-agnostic.
 */

/**
 * Clamp a day-of-month to the last valid day of the given year/month.
 * Handles February (incl. leap years) and 30-day months.
 *
 * @param {number} year   - full year
 * @param {number} month  - 1-based month (1=Jan … 12=Dec)
 * @param {number} day    - day to clamp
 * @returns {number}
 */
function clampDayOfMonth(year, month, day) {
  // new Date(Date.UTC(year, month, 0)) = UTC last day of `month - 1` (1-based month)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.min(day, daysInMonth);
}

/**
 * Return a UTC-midnight Date for the given year/month/day (1-based month),
 * clamped to the last valid day of that month.
 */
function utcDate(year, month, day) {
  const d = clampDayOfMonth(year, month, day);
  return new Date(Date.UTC(year, month - 1, d));
}

/**
 * Normalise any Date to UTC midnight (stripping the time component).
 */
function toUTCMidnight(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Return every occurrence date that should be generated for a rule.
 *
 * An occurrence is included when ALL of:
 *   - occurrence >= startDate (normalised to UTC midnight)
 *   - occurrence <= today (normalised to UTC midnight)
 *   - occurrence > lastGeneratedDate (or lastGeneratedDate is null)
 *
 * @param {Object}    rule
 * @param {Date}      rule.startDate
 * @param {number}    rule.interval          - months between occurrences (1 | 6 | 12)
 * @param {number}    rule.dayOfMonth        - 1–31
 * @param {Date|null} rule.lastGeneratedDate
 * @param {Date}      today
 * @returns {Date[]}  sorted ascending
 */
function occurrencesDue({ startDate, interval, dayOfMonth, lastGeneratedDate }, today) {
  const start = toUTCMidnight(startDate);
  const todayUTC = toUTCMidnight(today);
  const lastGen = lastGeneratedDate ? toUTCMidnight(lastGeneratedDate) : null;

  if (start > todayUTC) return [];

  const due = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1; // convert to 1-based

  for (let i = 0; i < 600; i++) {
    const occurrence = utcDate(year, month, dayOfMonth);

    if (occurrence > todayUTC) break;

    if (occurrence >= start && (!lastGen || occurrence > lastGen)) {
      due.push(occurrence);
    }

    // Advance by interval months
    month += interval;
    while (month > 12) {
      month -= 12;
      year += 1;
    }
  }

  return due;
}

module.exports = { clampDayOfMonth, occurrencesDue };
