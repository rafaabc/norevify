'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { assertTestDb, dbNameFromUri } = require('../helpers/assertTestDb.js');

describe('assertTestDb', () => {
  it('accepts a database ending in _test', () => {
    assert.equal(
      assertTestDb('mongodb+srv://u:p@host.mongodb.net/norevify_test?x=1'),
      'norevify_test',
    );
  });

  it('rejects the production database name', () => {
    assert.throws(
      () => assertTestDb('mongodb+srv://u:p@host.mongodb.net/norevify?x=1'),
      /norevify/,
    );
  });

  it('rejects a URI with no database path', () => {
    assert.throws(() => assertTestDb('mongodb+srv://u:p@host.mongodb.net/?x=1'), /\(default\)/);
  });

  it('rejects an unset URI', () => {
    assert.throws(() => assertTestDb(undefined), /Refusing/);
  });

  it('parses the name without a query string', () => {
    assert.equal(dbNameFromUri('mongodb://localhost:27017/foo_test'), 'foo_test');
  });
});
