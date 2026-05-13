'use strict';

const { request, expect, BASE_URL, uniqueUsername, registerAndTrack } = require('../base/api-base');

// ─── US-05: Change Password ───────────────────────────────────────────────────

describe('US-05 - Change Password', () => {
  describe('PATCH /api/auth/password', () => {

    it('[TC-05-01] should return 200 when username exists and credentials are valid', async () => {
      const username = uniqueUsername('tc0501');
      await registerAndTrack(username, 'Password1');

      const res = await request(BASE_URL)
        .patch('/api/auth/password')
        .send({ username, currentPassword: 'Password1', newPassword: 'NewPass99' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.is.a('string');
    });

    it('[TC-05-02] should return 404 when username does not exist', async () => {
      const res = await request(BASE_URL)
        .patch('/api/auth/password')
        .send({ username: 'nonexistent_xyz_abc', currentPassword: 'Password1', newPassword: 'NewPass99' });

      expect(res.status).to.equal(404);
    });

    it('[TC-05-03] should return 401 when currentPassword is wrong', async () => {
      const username = uniqueUsername('tc0503');
      await registerAndTrack(username, 'Password1');

      const res = await request(BASE_URL)
        .patch('/api/auth/password')
        .send({ username, currentPassword: 'WrongPass1', newPassword: 'NewPass99' });

      expect(res.status).to.equal(401);
    });

    it('[TC-05-04] should return 400 when newPassword is too short', async () => {
      const username = uniqueUsername('tc0504');
      await registerAndTrack(username, 'Password1');

      const res = await request(BASE_URL)
        .patch('/api/auth/password')
        .send({ username, currentPassword: 'Password1', newPassword: 'short' });

      expect(res.status).to.equal(400);
    });

    it('[TC-05-05] should return 400 when required fields are missing', async () => {
      const res = await request(BASE_URL)
        .patch('/api/auth/password')
        .send({});

      expect(res.status).to.equal(400);
    });

  });
});
