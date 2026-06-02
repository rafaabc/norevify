import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const POST = withAuth(async (req, _ctx, user) => {
  await connectDB();
  try {
    const { idToken } = await req.json();
    const result = await authService.linkGoogle({ userId: user.id, idToken });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: reportHandlerError(err, { route: '/api/auth/google/link' }) });
  }
});

export const DELETE = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const result = await authService.unlinkGoogle({ userId: user.id });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: reportHandlerError(err, { route: '/api/auth/google/link' }) });
  }
});
