import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import remindersService from '@/lib/services/reminders.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const GET = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const result = await remindersService.getBadgeCount(user.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: reportHandlerError(err, { route: '/api/reminders/badge-count' }) },
    );
  }
});
