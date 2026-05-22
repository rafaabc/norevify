export const dynamic = 'force-dynamic';

export async function GET() {
  throw new Error('Sentry connectivity test — revert after first event');
}
