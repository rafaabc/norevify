const Sentry = require('@sentry/nextjs');

async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config.mjs');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config.mjs');
  }
}

module.exports = {
  register,
  onRequestError: Sentry.captureRequestError,
};
