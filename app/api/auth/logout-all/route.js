import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

// Revokes every session token issued so far, including the caller's own — the
// client clears its token and returns to /login after a 200.
export const POST = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const result = await authService.signOutEverywhere({ userId: user.id });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/auth/logout-all', method: 'POST' });
  }
});
