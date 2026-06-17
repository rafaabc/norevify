'use strict';

if (!globalThis._rateLimit) globalThis._rateLimit = {};

// Next.js base-server.js sets x-forwarded-for to socket.remoteAddress when absent,
// so loopback IPs appear in local/CI. Vercel always sets a real client IP in prod.
const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']); // NOSONAR — intentional loopback allowlist

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

function createRateLimiter({ max, windowMs, key = 'default' }) {
  return {
    consume(ip) {
      if (!ip || LOOPBACK_IPS.has(ip)) return { allowed: true };

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

// Wraps a route handler with rate limiting. Returns 429 if limit exceeded.
function withRateLimitedHandler(limiter, handler) {
  return async function (req) {
    const rl = limiter.consume(clientIp(req));
    if (!rl.allowed) {
      return Response.json(
        { message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }
    return handler(req);
  };
}

module.exports = { createRateLimiter, clientIp, withRateLimitedHandler };
