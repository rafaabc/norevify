// https://docs.sentry.io/platforms/javascript/guides/nextjs/
const Sentry = require('@sentry/nextjs');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
});

module.exports = {
  onRouterTransitionStart: Sentry.captureRouterTransitionStart,
};
