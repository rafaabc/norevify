import jwt from 'jsonwebtoken';
import { connectDB } from './db.mjs';
import userModel from './models/user.model.js';

function jsonErr(message, status) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Lets a stolen/leaked access token be revoked server-side even though it's
// still cryptographically valid and unexpired: password change/reset and
// unlinking Google all bump `tokenVersion` (lib/models/user.model.js), and a
// token's `tv` claim (set at issue time — see issueToken) must match the
// current value or the request is rejected. Cached briefly per-instance so
// this doesn't cost a Mongo read on every authenticated request — revocation
// takes up to this TTL to propagate to a given Fluid Compute instance.
const TOKEN_VERSION_CACHE_TTL_MS = 5000;
const tokenVersionCache = (globalThis.__tokenVersionCache ??= new Map());

async function currentTokenVersion(id) {
  const now = Date.now();
  const cached = tokenVersionCache.get(id);
  if (cached && cached.expiresAt > now) return cached.tv;

  await connectDB();
  const user = await userModel.findById(id);
  if (!user) return null;

  const tv = user.tokenVersion ?? 0;
  tokenVersionCache.set(id, { tv, expiresAt: now + TOKEN_VERSION_CACHE_TTL_MS });
  return tv;
}

export function withAuth(handler) {
  return async (req, ctx) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return jsonErr('Token not provided', 401);
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      return jsonErr('Invalid or expired token', 401);
    }
    // Session tokens (issueToken) carry typ: 'access' and an id claim. Single-purpose
    // tokens (password-reset, etc.) are signed with the same JWT_SECRET but neither of
    // those, so a leaked reset token can't double as an API session credential here.
    if (user.typ !== 'access' || typeof user.id !== 'string' || !user.id) {
      return jsonErr('Invalid or expired token', 401);
    }
    const dbTokenVersion = await currentTokenVersion(user.id);
    if (dbTokenVersion === null || dbTokenVersion !== (user.tv ?? 0)) {
      return jsonErr('Invalid or expired token', 401);
    }
    return handler(req, ctx, user);
  };
}

export function withVerifiedUser(handler) {
  return withAuth((req, ctx, user) => {
    if (!user.emailVerified) return jsonErr('Email not verified', 403);
    return handler(req, ctx, user);
  });
}
