import { describe, it, expect } from 'vitest';
import { decodeJwt } from '@/utils/decodeJwt.js';

function makeToken(payload) {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.sig`;
}

describe('decodeJwt', () => {
  it('should decode a valid JWT payload', () => {
    const payload = { id: 'abc123', username: 'user1', currency: 'BRL', language: 'pt-BR' };
    expect(decodeJwt(makeToken(payload))).toEqual(payload);
  });

  it('should return null when token is malformed', () => {
    expect(decodeJwt('not.a.jwt')).toBeNull();
  });

  it('should return null when token has no dot separators', () => {
    expect(decodeJwt('invalidtoken')).toBeNull();
  });

  it('should return null when payload segment is invalid base64', () => {
    expect(decodeJwt('header.!!!invalid!!!.sig')).toBeNull();
  });
});
