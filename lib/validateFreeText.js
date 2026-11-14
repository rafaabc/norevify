const NOTE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 200;
const VEHICLE_NAME_MAX_LENGTH = 50;

// Bounds type and length of a user free-text field. null/undefined pass — callers
// decide whether the field is required. Mirrors validateTitle in reminders.service.js.
function validateFreeText(field, value, max) {
  if (value === undefined || value === null) return;
  let err;
  if (typeof value !== 'string') {
    err = new Error(`${field} must be a string`);
  } else if (value.length > max) {
    err = new Error(`${field} must be at most ${max} characters`);
  }
  if (err) {
    err.status = 400;
    throw err;
  }
}

module.exports = {
  validateFreeText,
  NOTE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  VEHICLE_NAME_MAX_LENGTH,
};
