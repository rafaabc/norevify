'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { validateRequiredEnv } = require('../../lib/validateEnv');

const VALID_ENV = {
  JWT_SECRET: 'a-sufficiently-long-test-secret',
  MONGODB_URI: 'mongodb://localhost:27017/test',
  CRON_SECRET: 'some-cron-secret',
  TRUSTED_PROXY: 'true',
};

describe('validateRequiredEnv()', () => {
  it('does not throw when all required vars are present and long enough', () => {
    assert.doesNotThrow(() => validateRequiredEnv(VALID_ENV));
  });

  it('throws when JWT_SECRET is missing', () => {
    const env = { ...VALID_ENV, JWT_SECRET: undefined };
    assert.throws(() => validateRequiredEnv(env), /JWT_SECRET/);
  });

  it('throws when JWT_SECRET is below the minimum length', () => {
    const env = { ...VALID_ENV, JWT_SECRET: 'short' };
    assert.throws(() => validateRequiredEnv(env), /JWT_SECRET/);
  });

  it('throws when MONGODB_URI is missing', () => {
    const env = { ...VALID_ENV, MONGODB_URI: undefined };
    assert.throws(() => validateRequiredEnv(env), /MONGODB_URI/);
  });

  it('reports every missing required var in a single error', () => {
    const env = { ...VALID_ENV, JWT_SECRET: undefined, MONGODB_URI: undefined };
    assert.throws(
      () => validateRequiredEnv(env),
      /JWT_SECRET.*MONGODB_URI|MONGODB_URI.*JWT_SECRET/,
    );
  });

  it('does not throw when CRON_SECRET is missing — it is recommended, not required', () => {
    const env = { ...VALID_ENV, CRON_SECRET: undefined };
    assert.doesNotThrow(() => validateRequiredEnv(env));
  });

  it('reports a missing CRON_SECRET via the callback instead of throwing', () => {
    const env = { ...VALID_ENV, CRON_SECRET: undefined };
    const reported = [];
    validateRequiredEnv(env, (key) => reported.push(key));
    assert.deepStrictEqual(reported, ['CRON_SECRET']);
  });

  it('does not report anything when CRON_SECRET and TRUSTED_PROXY are present', () => {
    const reported = [];
    validateRequiredEnv(VALID_ENV, (key) => reported.push(key));
    assert.deepStrictEqual(reported, []);
  });

  it('reports TRUSTED_PROXY missing when not on Vercel and no trusted proxy is declared', () => {
    const env = { ...VALID_ENV, TRUSTED_PROXY: undefined };
    const reported = [];
    validateRequiredEnv(env, (key) => reported.push(key));
    assert.deepStrictEqual(reported, ['TRUSTED_PROXY']);
  });

  it('does not report TRUSTED_PROXY when running on Vercel', () => {
    const env = { ...VALID_ENV, TRUSTED_PROXY: undefined, VERCEL: '1' };
    const reported = [];
    validateRequiredEnv(env, (key) => reported.push(key));
    assert.deepStrictEqual(reported, []);
  });

  it('does not report TRUSTED_PROXY when it is explicitly declared true', () => {
    const env = { ...VALID_ENV, TRUSTED_PROXY: 'true' };
    const reported = [];
    validateRequiredEnv(env, (key) => reported.push(key));
    assert.deepStrictEqual(reported, []);
  });
});
