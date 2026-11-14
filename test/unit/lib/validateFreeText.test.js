'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateFreeText } = require('../../../lib/validateFreeText');

describe('validateFreeText()', () => {
  it('passes undefined, null, and strings within the limit', () => {
    assert.doesNotThrow(() => validateFreeText('note', undefined, 5));
    assert.doesNotThrow(() => validateFreeText('note', null, 5));
    assert.doesNotThrow(() => validateFreeText('note', 'abcde', 5));
  });

  it('rejects non-strings with 400', () => {
    for (const v of [1, {}, [], true]) {
      assert.throws(
        () => validateFreeText('note', v, 5),
        (err) => err.status === 400 && err.message === 'note must be a string',
      );
    }
  });

  it('rejects strings over the limit with 400', () => {
    assert.throws(
      () => validateFreeText('note', 'abcdef', 5),
      (err) => err.status === 400 && err.message === 'note must be at most 5 characters',
    );
  });
});
