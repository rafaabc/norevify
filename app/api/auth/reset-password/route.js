import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';
import { reportHandlerError } from '@/lib/sentry.mjs';

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.resetPassword(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: reportHandlerError(err, { route: '/api/auth/reset-password', method: 'POST' }) });
  }
}
