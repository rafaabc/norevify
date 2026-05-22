export async function register() {
  const Sentry = await import('@sentry/nextjs');
  const dsn =
    process.env.NEXT_RUNTIME === 'edge'
      ? process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
      : process.env.SENTRY_DSN;

  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    enabled: process.env.NODE_ENV === 'production' && !!dsn,
    beforeSend(event) {
      if (event.level !== 'error') return null;
      return event;
    },
  });
}

export async function onRequestError(err, request, context) {
  const { captureRequestError } = await import('@sentry/nextjs');
  captureRequestError(err, request, context);
}
