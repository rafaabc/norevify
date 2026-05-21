import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';

export async function GET() {
  throw new Error('sentry test — remove after verify');
  try {
    await connectDB();
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch {
    return NextResponse.json({ status: 'error', db: 'disconnected' }, { status: 503 });
  }
}
