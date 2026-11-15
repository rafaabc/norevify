'use strict';

// test-api and e2e register real users over HTTP and write straight to Mongo, so they
// must never run against the production database. Enforce a `_test` database name.
function dbNameFromUri(uri) {
  if (!uri) return '';
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(uri);
  return match ? decodeURIComponent(match[1]) : '';
}

function assertTestDb(uri = process.env.MONGODB_URI) {
  const name = dbNameFromUri(uri);
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against database "${name || '(default)'}": MONGODB_URI must ` +
        'point at a database whose name ends in "_test" (e.g. /norevify_test).',
    );
  }
  return name;
}

module.exports = { assertTestDb, dbNameFromUri };
