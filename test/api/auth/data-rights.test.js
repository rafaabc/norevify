'use strict';

const { request, expect, BASE_URL, createAndLoginUser } = require('../base/api-base');

describe('US-XX - Data Subject Rights', () => {
  describe('GET /api/auth/me/export', () => {
    it('[TC-DR-01] should return 200 with user data structure', async () => {
      const token = await createAndLoginUser('export');
      const res = await request(BASE_URL)
        .get('/api/auth/me/export')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('user');
      expect(res.body).to.have.property('expenses');
      expect(res.body).to.have.property('reminders');
      expect(res.body.user).to.not.have.property('password');
      expect(res.body.user).to.not.have.property('googleId');
    });
  });

  // A successful delete needs a fresh Google ID token whose subject matches the
  // account — not producible in CI (covered in test/integration/data-rights.flow).
  describe('DELETE /api/auth/me', () => {
    it('[TC-DR-02] should return 400 when no idToken is supplied', async () => {
      const token = await createAndLoginUser('delnotok');

      const res = await request(BASE_URL)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).to.equal(400);
    });

    it('[TC-DR-03] should return 401 when the idToken is not a valid Google token, leaving the account intact', async () => {
      const token = await createAndLoginUser('delbad');

      const res = await request(BASE_URL)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ idToken: 'forged' });
      expect(res.status).to.equal(401);

      const still = await request(BASE_URL)
        .get('/api/auth/me/export')
        .set('Authorization', `Bearer ${token}`);
      expect(still.status).to.equal(200);
    });

    it('[TC-DR-05] should return 401 without a session token', async () => {
      const res = await request(BASE_URL).delete('/api/auth/me').send({ idToken: 'x' });
      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/auth/me/access', () => {
    it('[TC-DR-04] should return 200 with data treatment disclosure', async () => {
      const token = await createAndLoginUser('access');
      const res = await request(BASE_URL)
        .get('/api/auth/me/access')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('dataController');
      expect(res.body).to.have.property('dpoContact');
      expect(res.body).to.have.property('retention');
    });
  });
});
