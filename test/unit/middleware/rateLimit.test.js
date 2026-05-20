'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// RFC 5737 documentation-range IPs — not real hosts, safe for test fixtures
const IP_A = '192.0.2.1';
const IP_B = '192.0.2.2';
const IP_C = '192.0.2.3';

let createRateLimiter;
let clientIp;
let withRateLimitedHandler;

beforeEach(() => {
  delete require.cache[require.resolve('../../../lib/middleware/rateLimit.js')];
  if (globalThis._rateLimit) globalThis._rateLimit = {};
  ({ createRateLimiter, clientIp, withRateLimitedHandler } = require('../../../lib/middleware/rateLimit.js'));
});

function makeReq(forwardedFor) {
  return { headers: { get: (h) => (h === 'x-forwarded-for' ? forwardedFor : null) } };
}

describe('clientIp()', () => {
  it('should return the first IP from x-forwarded-for', () => {
    assert.strictEqual(clientIp(makeReq(`${IP_A}, ${IP_B}`)), IP_A);
  });

  it('should return null when x-forwarded-for is absent', () => {
    assert.strictEqual(clientIp(makeReq(null)), null);
  });
});

describe('createRateLimiter()', () => {
  it('should allow a request under the limit', () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    assert.strictEqual(limiter.consume(IP_A).allowed, true);
  });

  it('should block the request when limit is exceeded', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    limiter.consume(IP_A);
    limiter.consume(IP_A);
    limiter.consume(IP_A);
    assert.strictEqual(limiter.consume(IP_A).allowed, false);
  });

  it('should count requests per IP independently', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
    limiter.consume(IP_A);
    limiter.consume(IP_A);
    assert.strictEqual(limiter.consume(IP_A).allowed, false);
    assert.strictEqual(limiter.consume(IP_B).allowed, true);
  });

  it('should reset after the window expires', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 100 });
    limiter.consume(IP_A);
    assert.strictEqual(limiter.consume(IP_A).allowed, false);

    const store = globalThis._rateLimit;
    const key = Object.keys(store).find((k) => k.includes(IP_A));
    store[key].windowStart = Date.now() - 200;

    assert.strictEqual(limiter.consume(IP_A).allowed, true);
  });

  it('should include retryAfterMs in blocked response', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    limiter.consume(IP_C);
    const result = limiter.consume(IP_C);
    assert.strictEqual(result.allowed, false);
    assert.ok(result.retryAfterMs > 0, 'retryAfterMs should be positive');
  });

  it('should allow all requests when ip is null (no x-forwarded-for)', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(limiter.consume(null).allowed, true);
    }
  });

  it('should bypass rate limit for loopback IPs (Next.js injects socket.remoteAddress)', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    for (const loopback of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      for (let i = 0; i < 5; i++) {
        assert.strictEqual(limiter.consume(loopback).allowed, true, `should bypass for ${loopback}`);
      }
    }
  });

  it('should isolate counters across different limiter instances (different keys)', () => {
    const loginLimiter = createRateLimiter({ max: 2, windowMs: 60_000, key: 'login' });
    const registerLimiter = createRateLimiter({ max: 2, windowMs: 60_000, key: 'register' });

    loginLimiter.consume(IP_A);
    loginLimiter.consume(IP_A);
    assert.strictEqual(loginLimiter.consume(IP_A).allowed, false);
    assert.strictEqual(registerLimiter.consume(IP_A).allowed, true);
  });
});

describe('withRateLimitedHandler()', () => {
  it('should call handler when under limit', async () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    const handler = async () => new Response('ok', { status: 200 });
    const wrapped = withRateLimitedHandler(limiter, handler);
    const res = await wrapped(makeReq(IP_A));
    assert.strictEqual(res.status, 200);
  });

  it('should return 429 when limit exceeded', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const handler = async () => new Response('ok', { status: 200 });
    const wrapped = withRateLimitedHandler(limiter, handler);
    await wrapped(makeReq(IP_B));
    const res = await wrapped(makeReq(IP_B));
    assert.strictEqual(res.status, 429);
    assert.ok(res.headers.get('Retry-After'), 'should set Retry-After header');
  });

  it('should bypass limit when ip is null or loopback', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const handler = async () => new Response('ok', { status: 200 });
    const wrapped = withRateLimitedHandler(limiter, handler);
    for (const ip of [null, '127.0.0.1', '::1']) {
      for (let i = 0; i < 3; i++) {
        const res = await wrapped(makeReq(ip));
        assert.strictEqual(res.status, 200, `should bypass for ${ip}`);
      }
    }
  });
});
