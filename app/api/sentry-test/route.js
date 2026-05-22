import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = Sentry.getClient();
  const opts = client?.getOptions?.();
  const eventId = Sentry.captureException(
    new Error('Sentry connectivity test — delete route after event appears')
  );
  const flushed = await Sentry.flush(3000);
  return NextResponse.json({
    eventId,
    flushed,
    clientPresent: !!client,
    dsnPresent: !!opts?.dsn,
    enabled: opts?.enabled,
    env: process.env.NODE_ENV,
    dsnEnvSet: !!process.env.SENTRY_DSN,
  });
}
