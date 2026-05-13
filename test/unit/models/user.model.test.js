'use strict';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const userModel = require('../../../src/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('userModel.create()', () => {
  it('should create a user with a unique _id', async () => {
    const user = await userModel.create({ username: 'alice', password: 'hashed' });
    assert.ok(user._id);
    assert.strictEqual(user.username, 'alice');
  });

  it('should assign distinct _ids to multiple users', async () => {
    const first = await userModel.create({ username: 'alice', password: 'hashed' });
    const second = await userModel.create({ username: 'bob', password: 'hashed' });
    assert.notStrictEqual(first._id.toString(), second._id.toString());
  });
});

describe('userModel.findByUsername()', () => {
  it('should return the user when the username matches', async () => {
    await userModel.create({ username: 'alice', password: 'hashed' });
    const found = await userModel.findByUsername('alice');
    assert.ok(found);
    assert.strictEqual(found.username, 'alice');
  });

  it('should return null when the username does not exist', async () => {
    const found = await userModel.findByUsername('nobody');
    assert.strictEqual(found, null);
  });
});

describe('userModel.findById()', () => {
  it('should return the user when id matches', async () => {
    const created = await userModel.create({ username: 'alice', password: 'hashed' });
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
    await userModel.create({ username: 'alice', password: 'hashed' });
    await userModel._reset();
    const found = await userModel.findByUsername('alice');
    assert.strictEqual(found, null);
  });
});

describe('userModel.updatePassword()', () => {
  it('should persist hashed password to the user document', async () => {
    await userModel.create({ username: 'alice', password: 'original_hash' });
    await userModel.updatePassword('alice', 'new_hash');
    const found = await userModel.findByUsername('alice');
    assert.strictEqual(found.password, 'new_hash');
  });
});
