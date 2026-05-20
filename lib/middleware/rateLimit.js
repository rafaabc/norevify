'use strict';

if (!globalThis._rateLimit) globalThis._rateLimit = {};

function createRateLimiter({ max, windowMs, key = 'default' }) {
  return {
    consume(ip) {
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

module.exports = { createRateLimiter };
