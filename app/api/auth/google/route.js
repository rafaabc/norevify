import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';
import { createRateLimiter, withRateLimitedHandler } from '@/lib/middleware/rateLimit';
import { reportHandlerError } from '@/lib/sentry.mjs';

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60_000, key: 'google' });

export const POST = withRateLimitedHandler(limiter, async (req) => {
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.googleLogin(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: reportHandlerError(err, { route: '/api/auth/google', method: 'POST' }) },
    );
  }
});
