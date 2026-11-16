'use strict';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const userModel = require('../../../lib/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('userModel.create()', () => {
  it('should create a user with a unique _id', async () => {
    const user = await userModel.create({
      username: 'alice',
      email: 'alice@example.com',
    });
    assert.ok(user._id);
    assert.strictEqual(user.username, 'alice');
  });

  it('should populate createdAt and updatedAt timestamps', async () => {
    const user = await userModel.create({
      username: 'ts_user',
      email: 'ts@example.com',
    });
    assert.ok(user.createdAt instanceof Date, 'createdAt should be a Date');
    assert.ok(user.updatedAt instanceof Date, 'updatedAt should be a Date');
  });

  it('should assign distinct _ids to multiple users', async () => {
    const first = await userModel.create({
      username: 'alice',
      email: 'alice@example.com',
    });
    const second = await userModel.create({
      username: 'bob',
      email: 'bob@example.com',
    });
    assert.notStrictEqual(first._id.toString(), second._id.toString());
  });
});

describe('userModel.findByUsername()', () => {
  it('should return the user when the username matches', async () => {
    await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
    const found = await userModel.findByUsername('alice');
    assert.ok(found);
    assert.strictEqual(found.username, 'alice');
  });

  it('should return null when the username does not exist', async () => {
    const found = await userModel.findByUsername('nobody');
    assert.strictEqual(found, null);
  });
});

describe('userModel.findByEmail()', () => {
  it('should return the user when the email matches', async () => {
    await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
    const found = await userModel.findByEmail('alice@example.com');
    assert.ok(found);
    assert.strictEqual(found.email, 'alice@example.com');
  });

  it('should return null when the email does not exist', async () => {
    const found = await userModel.findByEmail('nobody@example.com');
    assert.strictEqual(found, null);
  });
});

describe('userModel.findById()', () => {
  it('should return the user when id matches', async () => {
    const created = await userModel.create({
      username: 'alice',
      email: 'alice@example.com',
    });
    const found = await userModel.findById(created._id);
    assert.ok(found);
    assert.strictEqual(found.username, 'alice');
  });

  it('should return null when id does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const found = await userModel.findById(fakeId);
    assert.strictEqual(found, null);
  });
});

describe('userModel._reset()', () => {
  it('should clear all users from the collection', async () => {
    await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
    await userModel._reset();
    const found = await userModel.findByUsername('alice');
    assert.strictEqual(found, null);
  });
});

describe('userModel language field', () => {
  it('should default language to pt-BR', async () => {
    const user = await userModel.create({ username: 'lang1', password: 'h', email: 'lang1@x.com' });
    assert.strictEqual(user.language, 'pt-BR');
  });

  it('should reject an unsupported language value', async () => {
    await assert.rejects(
      () =>
        userModel.create({
          username: 'lang2',
          email: 'lang2@x.com',
          language: 'fr',
        }),
      /language/i,
    );
  });

  it('should persist and retrieve updateLanguage', async () => {
    const user = await userModel.create({ username: 'lang3', password: 'h', email: 'lang3@x.com' });
    await userModel.updateLanguage(user._id, 'en');
    const found = await userModel.findById(user._id);
    assert.strictEqual(found.language, 'en');
  });
});

describe('userModel — odometer', () => {
  it('should default currentKm to 0 and currentKmUpdatedAt to undefined', async () => {
    const user = await userModel.create({
      username: 'odo1',
      email: 'odo1@test.com',
    });
    assert.strictEqual(user.currentKm, 0);
    assert.strictEqual(user.currentKmUpdatedAt, undefined);
  });

  it('should update currentKm and currentKmUpdatedAt via updateOdometerAndReturn', async () => {
    const user = await userModel.create({
      username: 'odo2',
      email: 'odo2@test.com',
    });
    const updated = await userModel.updateOdometerAndReturn(user._id, 12345);
    assert.strictEqual(updated.currentKm, 12345);
    assert.ok(updated.currentKmUpdatedAt instanceof Date);
  });
});

describe('userModel — role', () => {
  it('should default role to user', async () => {
    const user = await userModel.create({
      username: 'role1',
      email: 'role1@example.com',
    });
    assert.strictEqual(user.role, 'user');
  });

  it('should reject an unsupported role value', async () => {
    await assert.rejects(
      () =>
        userModel.create({
          username: 'role2',
          email: 'role2@example.com',
          role: 'superuser',
        }),
      /role/i,
    );
  });

  it('updateRole() should persist the new role', async () => {
    const user = await userModel.create({
      username: 'role3',
      email: 'role3@example.com',
    });
    await userModel.updateRole(user._id, 'admin');
    const found = await userModel.findById(user._id);
    assert.strictEqual(found.role, 'admin');
  });

  it('listForAdmin() should return users sorted by createdAt descending, projected fields only', async () => {
    const first = await userModel.create({
      username: 'role_list1',
      email: 'role_list1@example.com',
    });
    const second = await userModel.create({
      username: 'role_list2',
      email: 'role_list2@example.com',
    });
    const list = await userModel.listForAdmin();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0]._id.toString(), second._id.toString());
    assert.strictEqual(list[1]._id.toString(), first._id.toString());
    assert.strictEqual(list[0].username, 'role_list2');
    assert.strictEqual(list[0].plan, 'free');
    assert.strictEqual(list[0].planSource, 'stripe');
    assert.strictEqual(list[0].role, 'user');
    assert.ok(list[0].createdAt instanceof Date);
    assert.strictEqual(list[0].password, undefined);
  });

  it('setPlanManually() should set plan and planSource atomically', async () => {
    const user = await userModel.create({
      username: 'role4',
      email: 'role4@example.com',
    });
    await userModel.setPlanManually(user._id, 'pro');
    const found = await userModel.findById(user._id);
    assert.strictEqual(found.plan, 'pro');
    assert.strictEqual(found.planSource, 'manual');
  });
});

describe('userModel — session revocation and Google identity', () => {
  it('bumpTokenVersion() should increment tokenVersion by one each call', async () => {
    const user = await userModel.create({ username: 'rev1', email: 'rev1@example.com' });
    assert.strictEqual(user.tokenVersion, 0);
    await userModel.bumpTokenVersion(user._id);
    await userModel.bumpTokenVersion(user._id);
    const found = await userModel.findById(user._id);
    assert.strictEqual(found.tokenVersion, 2);
  });

  it('linkGoogleId() should store the Google subject so findByGoogleId() resolves the user', async () => {
    const user = await userModel.create({ username: 'rev2', email: 'rev2@example.com' });
    await userModel.linkGoogleId(user._id, 'g-sub-rev2');
    const found = await userModel.findByGoogleId('g-sub-rev2');
    assert.strictEqual(found._id.toString(), user._id.toString());
  });

  it('toJSON should strip tokenVersion', async () => {
    const user = await userModel.create({ username: 'rev3', email: 'rev3@example.com' });
    assert.strictEqual(user.toJSON().tokenVersion, undefined);
  });

  it('should not persist a password field even if one is supplied', async () => {
    const user = await userModel.create({
      username: 'rev4',
      email: 'rev4@example.com',
    });
    const raw = await userModel.findById(user._id).lean();
    assert.strictEqual(raw.password, undefined);
  });
});
