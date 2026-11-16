'use strict';

// Inject a Resend mock into the require cache before loading email.service.
// The singleton (_resend) inside email.service will be initialized with MockResend
// on the first send call, so all tests share the same captured array.
const sentPayloads = [];

const MockResend = function (apiKey) {
  this._apiKey = apiKey;
  this.emails = {
    send: async (payload) => {
      sentPayloads.push(payload);
    },
  };
};

const resendPath = require.resolve('resend');
require.cache[resendPath] = {
  id: resendPath,
  filename: resendPath,
  loaded: true,
  exports: { Resend: MockResend },
};

const emailService = require('../../../lib/services/email.service');

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

beforeEach(() => {
  sentPayloads.splice(0);
  process.env.RESEND_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

describe('emailService.sendReminderDigest()', () => {
  it('should escape HTML in a reminder title instead of injecting it raw', async () => {
    await emailService.sendReminderDigest({
      to: 'user@example.com',
      overdue: [{ type: 'Other', title: '<a href="https://evil.example">click me</a>' }],
      dueSoon: [],
    });

    const { html } = sentPayloads[0];
    assert.ok(!html.includes('<a href="https://evil.example">'), 'raw anchor tag must not appear');
    assert.ok(
      html.includes('&lt;a href=&quot;https://evil.example&quot;&gt;click me&lt;/a&gt;'),
      'title must appear HTML-escaped',
    );
  });

  it('should still render reminders with no title', async () => {
    await emailService.sendReminderDigest({
      to: 'user@example.com',
      overdue: [{ type: 'Fuel', dueKm: 5000 }],
      dueSoon: [],
    });

    const { html } = sentPayloads[0];
    assert.ok(html.includes('Fuel'));
    assert.ok(html.includes('5000 km'));
  });
});
