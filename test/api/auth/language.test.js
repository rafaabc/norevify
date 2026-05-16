'use strict';

const { request, expect, authHeader } = require('../base/api-base');

describe('PATCH /api/auth/language', () => {
  it('[TC-LG-01] should return 200 and new JWT when language is valid', async () => {
    const res = await request.patch('/api/auth/language')
      .set(authHeader())
      .send({ language: 'en' });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('[TC-LG-02] should return 400 when language is not supported', async () => {
    const res = await request.patch('/api/auth/language')
      .set(authHeader())
      .send({ language: 'fr' });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.match(/must be one of/i);
  });

  it('[TC-LG-03] should return 401 when no token provided', async () => {
    const res = await request.patch('/api/auth/language').send({ language: 'en' });
    expect(res.status).to.equal(401);
  });
});
