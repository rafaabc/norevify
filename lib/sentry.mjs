import * as Sentry from '@sentry/nextjs';

export function reportHandlerError(err, context = {}) {
  const status = err.status || 500;
  if (status >= 500 || !err.status) {
    Sentry.captureException(err, { extra: context });
  }
  return status;
}
