'use strict';

if (!globalThis._rateLimit) globalThis._rateLimit = {};

// Returns null when x-forwarded-for is absent (local / CI). consume(null) bypasses limiting.
function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

function createRateLimiter({ max, windowMs, key = 'default' }) {
  return {
    consume(ip) {
      if (!ip) return { allowed: true };

      const storeKey = `${key}:${ip}`;
      const now = Date.now();
      const entry = globalThis._rateLimit[storeKey];

      if (!entry || now - entry.windowStart >= windowMs) {
        globalThis._rateLimit[storeKey] = { count: 1, windowStart: now };
        return { allowed: true };
      }

      if (entry.count >= max) {
        const retryAfterMs = windowMs - (now - entry.windowStart);
        return { allowed: false, retryAfterMs };
      }

      entry.count += 1;
      return { allowed: true };
    },
  };
}

module.exports = { createRateLimiter, clientIp };
