import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.verifyEmail(body);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/auth/verify-email', method: 'POST' });
  }
}
