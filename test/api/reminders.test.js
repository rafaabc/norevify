'use strict';

const { request, expect, createAndLoginUser } = require('./base/api-base');

describe('Reminders API', function () {
  this.timeout(20000);
  let token, otherToken;
  const future = (d) => new Date(Date.now() + d * 86400000).toISOString();

  before(async () => {
    token = await createAndLoginUser('rem');
    otherToken = await createAndLoginUser('remother');
  });

  describe('POST /api/reminders', () => {
    it('[TC-RE-01] should return 401 when token missing', async () => {
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .send({ type: 'Maintenance', dueKm: 10000 });
      expect(res.status).to.equal(401);
    });

    it('[TC-RE-02] should return 400 when neither dueDate nor dueKm provided', async () => {
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Maintenance' });
      expect(res.status).to.equal(400);
      expect(res.body.message).to.match(/must provide dueDate or dueKm/i);
    });

    it('[TC-RE-03] should return 201 with valid body', async () => {
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Maintenance', dueDate: future(30), dueKm: 10000, intervalMonths: 12, intervalKm: 10000 });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
    });
  });

  describe('GET /api/reminders', () => {
    it('[TC-RE-04] should list with computed status', async () => {
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .get('/api/reminders')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      if (res.body.length) expect(res.body[0]).to.have.property('status');
    });
  });

  describe('PUT /api/reminders/:id', () => {
    it('[TC-RE-05] should 404 for other user reminder', async () => {
      const created = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'inspection', dueDate: future(10) });
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .put(`/api/reminders/${created.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'hack' });
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/reminders/:id/complete', () => {
    it('[TC-RE-06] should complete and return next when intervals set', async () => {
      const created = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Maintenance', dueDate: future(30), dueKm: 50000, intervalMonths: 12, intervalKm: 10000 });
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post(`/api/reminders/${created.body.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completedKm: 50100 });
      expect(res.status).to.equal(200);
      expect(res.body.completed).to.have.property('completedAt');
      expect(res.body.next).to.not.be.null;
    });

    it('[TC-RE-07] should 400 on double-complete', async () => {
      const created = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'Maintenance', dueKm: 50000 });
      await request(process.env.BASE_URL || 'http://localhost:3000')
        .post(`/api/reminders/${created.body.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completedKm: 50000 });
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post(`/api/reminders/${created.body.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completedKm: 50000 });
      expect(res.status).to.equal(400);
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    it('[TC-RE-08] should 204 on success', async () => {
      const created = await request(process.env.BASE_URL || 'http://localhost:3000')
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'other', dueKm: 1000 });
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .delete(`/api/reminders/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(204);
    });
  });

  describe('GET /api/reminders/badge-count', () => {
    it('[TC-RE-09] should return numeric counts', async () => {
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .get('/api/reminders/badge-count')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('dueSoon');
      expect(res.body).to.have.property('overdue');
    });
  });

  describe('PATCH /api/auth/odometer', () => {
    it('[TC-RE-10] should reject rewind', async () => {
      await request(process.env.BASE_URL || 'http://localhost:3000')
        .patch('/api/auth/odometer')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentKm: 5000 });
      const res = await request(process.env.BASE_URL || 'http://localhost:3000')
        .patch('/api/auth/odometer')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentKm: 1000 });
      expect(res.status).to.equal(400);
    });
  });
});
