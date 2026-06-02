import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import remindersService from '@/lib/services/reminders.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export const POST = withAuth(async (req, ctx, user) => {
  await connectDB();
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const result = await remindersService.completeReminder(user.id, id, body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: reportHandlerError(err, { route: '/api/reminders/[id]/complete' }) });
  }
});
