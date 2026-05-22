import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.captureException(new Error('Sentry connectivity test — delete route after event appears'));
  await Sentry.flush(3000);
  return NextResponse.json({ sent: true });
}
