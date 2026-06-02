import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const DELETE = withAuth(async (req, ctx, user) => {
  await connectDB();
  try {
    const body = await req.json().catch(() => ({}));
    await authService.deleteAccount({ userId: user.id, password: body.password });
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: reportHandlerError(err, { route: '/api/auth/me', method: 'DELETE' }) });
  }
});
