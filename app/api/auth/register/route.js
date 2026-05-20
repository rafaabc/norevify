import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';
import { createRateLimiter, withRateLimitedHandler } from '@/lib/middleware/rateLimit';

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60_000, key: 'register' });

export const POST = withRateLimitedHandler(limiter, async (req) => {
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.register(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
