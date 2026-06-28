import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth, withVerifiedUser } from '@/lib/auth.mjs';
import recurringService from '@/lib/services/recurring.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const GET = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const result = await recurringService.listRules(user.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: reportHandlerError(err, { route: '/api/recurring' }) },
    );
  }
});

export const POST = withVerifiedUser(async (req, _ctx, user) => {
  await connectDB();
  try {
    const body = await req.json();
    const result = await recurringService.createRule(user.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: reportHandlerError(err, { route: '/api/recurring' }) },
    );
  }
});
