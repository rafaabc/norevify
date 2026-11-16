'use strict';

// Google is the only sign-in method, and a real Google ID token cannot be produced
// in CI. These tests cover what is reachable over HTTP: input validation on
// POST /api/auth/google, the JWT middleware, token refresh and session revocation —
// using seeded users (see test/helpers/seedUser.js).

const jwt = require('jsonwebtoken');
const { request, expect, BASE_URL, createAndLoginUser } = require('../base/api-base');

describe('US-01/02 - Google-only authentication', () => {
  describe('POST /api/auth/google', () => {
    it('[TC-01-01] should return 400 when idToken is missing', async () => {
      const res = await request(BASE_URL).post('/api/auth/google').send({});

      expect(res.status).to.equal(400);
    });

    it('[TC-01-02] should return 401 when the idToken is not a valid Google token', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/google')
        .send({ idToken: 'not-a-real-google-token' });

      expect(res.status).to.equal(401);
    });
  });

  describe('retired password endpoints', () => {
    for (const [method, path] of [
      ['post', '/api/auth/register'],
      ['post', '/api/auth/login'],
      ['post', '/api/auth/forgot-password'],
      ['post', '/api/auth/reset-password'],
      ['patch', '/api/auth/password'],
      ['post', '/api/auth/verify-email'],
      ['post', '/api/auth/resend-verification'],
    ]) {
      it(`[TC-01-03] ${method.toUpperCase()} ${path} should no longer exist (404/405)`, async () => {
        const res = await request(BASE_URL)[method](path).send({});

        expect(res.status).to.be.oneOf([404, 405]);
      });
    }
  });

  describe('token properties', () => {
    it('[TC-02-04] should accept a token in JWT format (three dot-separated base64url segments)', async () => {
      const token = await createAndLoginUser('tc0204');
      const parts = token.split('.');

      expect(parts).to.have.lengthOf(3);
      parts.forEach((part) => expect(part).to.match(/^[A-Za-z0-9_-]+$/));
    });

    it('[TC-02-05] should carry iat and exp claims', async () => {
      const payload = jwt.decode(await createAndLoginUser('tc0205'));

      expect(payload).to.have.property('iat').that.is.a('number');
      expect(payload).to.have.property('exp').that.is.a('number');
      expect(payload.exp).to.be.greaterThan(payload.iat);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('[TC-02-09] should re-issue a token for a valid session', async () => {
      const token = await createAndLoginUser('tc0209');

      const res = await request(BASE_URL)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token').that.is.a('string');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('[TC-02-10] should return 401 without a token', async () => {
      const res = await request(BASE_URL).post('/api/auth/logout-all');

      expect(res.status).to.equal(401);
    });

    it('[TC-02-11] should revoke the callers own token', async function () {
      // withAuth caches tokenVersion per instance for ~5s, so allow propagation.
      this.timeout(20000);
      const token = await createAndLoginUser('tc0211');

      const out = await request(BASE_URL)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${token}`);
      expect(out.status).to.equal(200);

      let status;
      for (let i = 0; i < 12; i++) {
        const res = await request(BASE_URL)
          .get('/api/expenses')
          .set('Authorization', `Bearer ${token}`);
        status = res.status;
        if (status === 401) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      expect(status).to.equal(401);
    });
  });

  describe('Authentication middleware (JWT)', () => {
    it('[TC-02-06] should return 401 when an expired token is presented', async () => {
      const expiredToken = jwt.sign(
        { id: 0, username: 'expired', exp: Math.floor(Date.now() / 1000) - 60 },
        process.env.JWT_SECRET,
      );

      const res = await request(BASE_URL)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid or expired token');
    });

    it('[TC-02-07] should return 401 when no Authorization header is provided', async () => {
      const res = await request(BASE_URL).get('/api/expenses');

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'Token not provided');
    });
  });
});
