'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let createRateLimiter;
let clientIp;

beforeEach(() => {
  // Clear module cache + global store between tests
  delete require.cache[require.resolve('../../../lib/middleware/rateLimit.js')];
  if (globalThis._rateLimit) globalThis._rateLimit = {};
  ({ createRateLimiter, clientIp } = require('../../../lib/middleware/rateLimit.js'));
});

function makeReq(forwardedFor) {
  return { headers: { get: (h) => (h === 'x-forwarded-for' ? forwardedFor : null) } };
}

describe('clientIp()', () => {
  it('should return the first IP from x-forwarded-for', () => {
    assert.strictEqual(clientIp(makeReq('1.2.3.4, 5.6.7.8')), '1.2.3.4');
  });

  it('should return null when x-forwarded-for is absent', () => {
    assert.strictEqual(clientIp(makeReq(null)), null);
  });
});

describe('createRateLimiter()', () => {
  it('should allow a request under the limit', () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    const result = limiter.consume('1.2.3.4');
    assert.strictEqual(result.allowed, true);
  });

  it('should block the request when limit is exceeded', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    limiter.consume('1.2.3.4');
    limiter.consume('1.2.3.4');
    limiter.consume('1.2.3.4');
    const result = limiter.consume('1.2.3.4');
    assert.strictEqual(result.allowed, false);
  });

  it('should count requests per IP independently', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
    limiter.consume('1.1.1.1');
    limiter.consume('1.1.1.1');
    const blocked = limiter.consume('1.1.1.1');
    assert.strictEqual(blocked.allowed, false);

    const different = limiter.consume('2.2.2.2');
    assert.strictEqual(different.allowed, true);
  });

  it('should reset after the window expires', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 100 });
    limiter.consume('1.2.3.4');
    const blocked = limiter.consume('1.2.3.4');
    assert.strictEqual(blocked.allowed, false);

    // Manually advance time by manipulating the stored entry
    const store = globalThis._rateLimit;
    const key = Object.keys(store).find((k) => k.includes('1.2.3.4'));
    store[key].windowStart = Date.now() - 200;

    const after = limiter.consume('1.2.3.4');
    assert.strictEqual(after.allowed, true);
  });

  it('should include retryAfterMs in blocked response', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    limiter.consume('5.5.5.5');
    const result = limiter.consume('5.5.5.5');
    assert.strictEqual(result.allowed, false);
    assert.ok(result.retryAfterMs > 0, 'retryAfterMs should be positive');
  });

  it('should allow all requests when ip is null (no x-forwarded-for)', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(limiter.consume(null).allowed, true);
    }
  });

  it('should isolate counters across different limiter instances (different keys)', () => {
    const loginLimiter = createRateLimiter({ max: 2, windowMs: 60_000, key: 'login' });
    const registerLimiter = createRateLimiter({ max: 2, windowMs: 60_000, key: 'register' });

    loginLimiter.consume('9.9.9.9');
    loginLimiter.consume('9.9.9.9');
    const loginBlocked = loginLimiter.consume('9.9.9.9');
    assert.strictEqual(loginBlocked.allowed, false);

    const registerAllowed = registerLimiter.consume('9.9.9.9');
    assert.strictEqual(registerAllowed.allowed, true);
  });
});
