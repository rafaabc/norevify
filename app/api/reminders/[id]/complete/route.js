import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import remindersService from '@/lib/services/reminders.service';

export const POST = withAuth(async (req, ctx, user) => {
  await connectDB();
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const result = await remindersService.completeReminder(user.id, id, body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
