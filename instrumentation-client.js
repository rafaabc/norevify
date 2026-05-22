// https://docs.sentry.io/platforms/javascript/guides/nextjs/
const Sentry = require('@sentry/nextjs');

Sentry.init({
  dsn: 'https://24961339ff620c9f9e4ed393a4ec2a75@o4511398942081024.ingest.de.sentry.io/4511428024598608',
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
