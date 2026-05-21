import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const result = await authService.verifyEmail(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
}
