'use strict';

// Suppress outbound email in tests. Require this before loading any service that
// sends mail so the in-process module cache mutation takes effect first.
const emailService = require('../../lib/services/email.service');
emailService.sendReminderDigest = async () => {};

module.exports = emailService;
