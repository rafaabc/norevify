import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const PATCH = withAuth(async (req, _ctx, user) => {
  await connectDB();
  try {
    const { currentKm } = await req.json();
    const result = await authService.updateOdometer({ id: user.id, currentKm });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: reportHandlerError(err, { route: '/api/auth/odometer', method: 'PATCH' }) },
    );
  }
});
