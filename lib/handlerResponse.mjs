import { reportHandlerError } from './sentry.mjs';

// Shared error-response builder for Route Handlers. `reportHandlerError` already
// decides the status code and reports 5xx to Sentry with `context`; this wraps
// that in the JSON body every handler returns, masking the internal exception
// message for 5xx so Mongoose/driver/Stripe/Resend internals never reach the
// client. 4xx messages are intentional and mapped in i18n/apiErrors.js, so they
// pass through unchanged.
//
// Built on the standard `Response` (not `NextResponse`) so this module has no
// 'next/server' import — Next's Route Handlers accept a plain Response, and
// avoiding the import lets this file load under plain `node --test`, unlike
// 'next/server' which only resolves under Next's own bundler.
//
// `report` is injectable (defaults to reportHandlerError) so the message-masking
// logic here can be unit tested without exercising the real Sentry.captureException
// call, which requires Next's instrumentation.js to have run first.
export function errorResponse(err, context = {}, report = reportHandlerError) {
  const status = report(err, context);
  const message = status >= 500 ? 'Internal server error' : err.message;
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
