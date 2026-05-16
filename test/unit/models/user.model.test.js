'use strict';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../../../src/constants/languages');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const userModel = require('../../../src/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

describe('userModel.create()', () => {
  it('should create a user with a unique _id', async () => {
    const user = await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
    assert.ok(user._id);
    assert.strictEqual(user.username, 'alice');
  });

  it('should assign distinct _ids to multiple users', async () => {
    const first  = await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
    const second = await userModel.create({ username: 'bob',   password: 'hashed', email: 'bob@example.com' });
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
    const created = await userModel.create({ username: 'alice', password: 'hashed', email: 'alice@example.com' });
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

describe('userModel.updatePassword()', () => {
  it('should persist hashed password to the user document', async () => {
    await userModel.create({ username: 'alice', password: 'original_hash', email: 'alice@example.com' });
    await userModel.updatePassword('alice', 'new_hash');
    const found = await userModel.findByUsername('alice');
    assert.strictEqual(found.password, 'new_hash');
  });
});

describe('userModel language field', () => {
  it('should default language to pt-BR', async () => {
    const user = await userModel.create({ username: 'lang1', password: 'h', email: 'lang1@x.com' });
    assert.strictEqual(user.language, 'pt-BR');
  });

  it('should reject an unsupported language value', async () => {
    await assert.rejects(
      () => userModel.create({ username: 'lang2', password: 'h', email: 'lang2@x.com', language: 'fr' }),
      /language/i
    );
  });

  it('should persist and retrieve updateLanguage', async () => {
    const user = await userModel.create({ username: 'lang3', password: 'h', email: 'lang3@x.com' });
    await userModel.updateLanguage(user._id, 'en');
    const found = await userModel.findById(user._id);
    assert.strictEqual(found.language, 'en');
  });
});
