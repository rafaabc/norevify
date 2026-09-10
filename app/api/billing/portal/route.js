import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withVerifiedUser } from '@/lib/auth.mjs';
import billingService from '@/lib/services/billing.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export const POST = withVerifiedUser(async (req, _ctx, user) => {
  await connectDB();
  try {
    const result = await billingService.createPortalSession({ userId: user.id });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/billing/portal', method: 'POST' });
  }
});
