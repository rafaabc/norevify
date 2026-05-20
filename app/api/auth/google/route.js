import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';
import { createRateLimiter, clientIp } from '@/lib/middleware/rateLimit';

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60_000, key: 'google' });

export async function POST(req) {
  const rl = limiter.consume(clientIp(req));
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
    });
  }
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.googleLogin(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
}
