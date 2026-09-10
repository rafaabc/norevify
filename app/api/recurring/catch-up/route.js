import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import recurringService from '@/lib/services/recurring.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export const POST = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const result = await recurringService.runCatchUp(user.id, new Date());
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/recurring/catch-up' });
  }
});
