'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const authService = require('../../../lib/services/auth.service');
const userModel = require('../../../lib/models/user.model');
const { POLICY_VERSION } = require('../../../lib/constants/legal');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const CONSENT = { policyVersion: POLICY_VERSION, acceptedAt: new Date().toISOString() };

// Creates a user straight through the model — there is no password sign-up any more,
// so tests that just need an existing account build one here.
async function createUser({ username, email, ...rest }) {
  const user = await userModel.create({ username, email, emailVerified: true, ...rest });
  return { id: user._id.toString(), username: user.username };
}

const fakePayload = (overrides = {}) => ({
  sub: 'google-sub-123',
  email: 'guser@gmail.com',
  emailVerified: true,
  name: 'G User',
  ...overrides,
});
const verifyAs =
  (overrides = {}) =>
  async () =>
    fakePayload(overrides);

// ---------------------------------------------------------------------------
// googleLogin — the only way to sign in or sign up
// ---------------------------------------------------------------------------

describe('authService.googleLogin() — new accounts', () => {
  it('should create a new user and return a token for a first-time Google sign-in', async () => {
    const result = await authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs());
    assert.ok(result.token);
    const user = await userModel.findByEmail('guser@gmail.com');
    assert.strictEqual(user.googleId, 'google-sub-123');
    assert.strictEqual(user.emailVerified, true);
  });

  it('should record the consent policyVersion, acceptance time and a hashed IP', async () => {
    await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT, ip: '203.0.113.9' },
      verifyAs(),
    );
    const user = await userModel.findByEmail('guser@gmail.com');
    assert.strictEqual(user.consent.policyVersion, POLICY_VERSION);
    assert.strictEqual(user.consent.acceptedAt.toISOString(), CONSENT.acceptedAt);
    const expected = crypto.createHash('sha256').update('203.0.113.9').digest('hex').slice(0, 16);
    assert.strictEqual(user.consent.ipHash, expected);
    assert.notStrictEqual(user.consent.ipHash, '203.0.113.9', 'the raw IP must never be stored');
  });

  it('should still store a well-formed hash when no IP is known', async () => {
    await authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs());
    const user = await userModel.findByEmail('guser@gmail.com');
    assert.match(user.consent.ipHash, /^[0-9a-f]{16}$/);
  });

  it('should throw 400 and create nothing when consent is missing', async () => {
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'tok' }, verifyAs()),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /consent with policyVersion and acceptedAt is required/);
        return true;
      },
    );
    assert.strictEqual(await userModel.findByEmail('guser@gmail.com'), null);
  });

  it('should throw 400 when consent has no acceptedAt', async () => {
    await assert.rejects(
      () =>
        authService.googleLogin(
          { idToken: 'tok', consent: { policyVersion: POLICY_VERSION } },
          verifyAs(),
        ),
      (err) => err.status === 400,
    );
  });

  it('should throw 400 when consent targets an outdated policy version', async () => {
    await assert.rejects(
      () =>
        authService.googleLogin(
          { idToken: 'tok', consent: { ...CONSENT, policyVersion: '1999-01-01' } },
          verifyAs(),
        ),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /does not match current policy/);
        return true;
      },
    );
    assert.strictEqual(await userModel.findByEmail('guser@gmail.com'), null);
  });

  it('should apply the requested currency to the new account', async () => {
    await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT, currency: 'USD' },
      verifyAs(),
    );
    const user = await userModel.findByEmail('guser@gmail.com');
    assert.strictEqual(user.currency, 'USD');
  });

  it('should throw 400 for an unsupported currency and create nothing', async () => {
    await assert.rejects(
      () =>
        authService.googleLogin({ idToken: 'tok', consent: CONSENT, currency: 'XXX' }, verifyAs()),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /currency must be one of/);
        return true;
      },
    );
    assert.strictEqual(await userModel.findByEmail('guser@gmail.com'), null);
  });

  it('should derive a valid username from the email local-part', async () => {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs({ email: 'john.doe@gmail.com' }),
    );
    assert.match(jwt.decode(token).username, /^\w{3,50}$/);
  });

  it('should append a suffix when the derived username collides', async () => {
    await createUser({ username: 'guser', email: 'other@example.com' });
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    const decoded = jwt.decode(token);
    assert.notStrictEqual(decoded.username, 'guser');
    assert.match(decoded.username, /^\w{3,50}$/);
  });

  it('should issue a session token carrying the full claim set', async () => {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.typ, 'access');
    assert.strictEqual(decoded.emailVerified, true);
    assert.strictEqual(decoded.plan, 'free');
    assert.strictEqual(decoded.role, 'user');
    assert.strictEqual(decoded.tv, 0);
    assert.strictEqual(typeof decoded.oiat, 'number');
    assert.ok(typeof decoded.id === 'string' && decoded.id.length > 0);
  });
});

describe('authService.googleLogin() — existing accounts', () => {
  it('should sign in the same user on a second login without needing consent again', async () => {
    const first = await authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs());
    const second = await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    assert.strictEqual(jwt.decode(first.token).id, jwt.decode(second.token).id);
  });

  it('should refresh lastLoginAt on each sign-in', async () => {
    await authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs());
    const first = (await userModel.findByEmail('guser@gmail.com')).lastLoginAt;
    await new Promise((r) => setTimeout(r, 5));
    await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    const second = (await userModel.findByEmail('guser@gmail.com')).lastLoginAt;
    assert.ok(second > first);
  });

  it('should link Google to a legacy account with the same verified email, with no new consent', async () => {
    await createUser({ username: 'alice', email: 'guser@gmail.com' });
    const { token } = await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    assert.strictEqual(jwt.decode(token).username, 'alice');
    const user = await userModel.findByUsername('alice');
    assert.strictEqual(user.googleId, 'google-sub-123');
  });

  it('should revoke earlier sessions when a verified Google owner takes over an unverified legacy account', async () => {
    // Pre-account-hijacking: someone registered this email and never verified it.
    const { id } = await createUser({
      username: 'squatter',
      email: 'guser@gmail.com',
      emailVerified: false,
    });
    const before = await userModel.findById(id);

    await authService.googleLogin({ idToken: 'tok' }, verifyAs());

    const user = await userModel.findById(id);
    assert.strictEqual((user.tokenVersion ?? 0) - (before.tokenVersion ?? 0), 1);
    assert.strictEqual(user.emailVerified, true);
  });

  it('should NOT bump tokenVersion when linking into an already-verified account', async () => {
    const { id } = await createUser({ username: 'owner', email: 'guser@gmail.com' });
    await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    assert.strictEqual((await userModel.findById(id)).tokenVersion ?? 0, 0);
  });

  it('should reject an unverified Google email that matches an existing account', async () => {
    await createUser({ username: 'victim', email: 'guser@gmail.com' });
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'tok' }, verifyAs({ emailVerified: false })),
      (err) => err.status === 401,
    );
    const victim = await userModel.findByUsername('victim');
    assert.strictEqual(victim.googleId, undefined, 'must not link an unverified Google account');
  });

  it('should reject a first-time Google sign-in with an unverified email', async () => {
    await assert.rejects(
      () =>
        authService.googleLogin(
          { idToken: 'tok', consent: CONSENT },
          verifyAs({ emailVerified: false }),
        ),
      (err) => err.status === 401,
    );
    assert.strictEqual(await userModel.findByEmail('guser@gmail.com'), null);
  });

  it('should throw 400 when idToken is missing', async () => {
    await assert.rejects(
      () => authService.googleLogin({}),
      (err) => err.status === 400,
    );
  });

  it('should throw 401 when the verifier rejects the token', async () => {
    const reject = async () => {
      const e = new Error('Invalid Google token');
      e.status = 401;
      throw e;
    };
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'bad' }, reject),
      (err) => err.status === 401,
    );
  });
});

describe('authService.googleLogin() - invite gate', () => {
  let originalInviteOnly;
  let originalInviteCodes;

  beforeEach(() => {
    originalInviteOnly = process.env.INVITE_ONLY;
    originalInviteCodes = process.env.INVITE_CODES;
  });

  afterEach(() => {
    if (originalInviteOnly === undefined) delete process.env.INVITE_ONLY;
    else process.env.INVITE_ONLY = originalInviteOnly;
    if (originalInviteCodes === undefined) delete process.env.INVITE_CODES;
    else process.env.INVITE_CODES = originalInviteCodes;
  });

  it('should throw 403 invite_required for a new-user sign-in with a bad/missing inviteCode', async () => {
    process.env.INVITE_ONLY = 'true';
    process.env.INVITE_CODES = 'GOOD-CODE';
    await assert.rejects(
      () => authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs()),
      (err) => {
        assert.strictEqual(err.status, 403);
        assert.match(err.message, /invite_required/);
        return true;
      },
    );
    assert.strictEqual(await userModel.findByEmail('guser@gmail.com'), null);
  });

  it('should create the account when the inviteCode is valid', async () => {
    process.env.INVITE_ONLY = 'true';
    process.env.INVITE_CODES = 'GOOD-CODE';
    const result = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT, inviteCode: 'GOOD-CODE' },
      verifyAs(),
    );
    assert.ok(result.token);
  });

  it('should bypass the gate for an existing-user sign-in (by googleId)', async () => {
    await authService.googleLogin({ idToken: 'tok', consent: CONSENT }, verifyAs());
    process.env.INVITE_ONLY = 'true';
    process.env.INVITE_CODES = 'GOOD-CODE';
    const result = await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    assert.ok(result.token);
  });
});

// ---------------------------------------------------------------------------
// signOutEverywhere — session revocation now that there is no password change
// ---------------------------------------------------------------------------

describe('authService.signOutEverywhere()', () => {
  it('should bump tokenVersion so previously issued tokens stop matching', async () => {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    const { id, tv } = jwt.decode(token);

    const result = await authService.signOutEverywhere({ userId: id });

    assert.ok(result.message);
    const user = await userModel.findById(id);
    assert.strictEqual(user.tokenVersion ?? 0, (tv ?? 0) + 1);
  });

  it('should keep revoking on every call', async () => {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    const { id } = jwt.decode(token);
    await authService.signOutEverywhere({ userId: id });
    await authService.signOutEverywhere({ userId: id });
    assert.strictEqual((await userModel.findById(id)).tokenVersion, 2);
  });

  it('should issue the new tokenVersion on the next sign-in', async () => {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    await authService.signOutEverywhere({ userId: jwt.decode(token).id });
    const next = await authService.googleLogin({ idToken: 'tok' }, verifyAs());
    assert.strictEqual(jwt.decode(next.token).tv, 1);
  });

  it('should throw 404 for an unknown user', async () => {
    await assert.rejects(
      () => authService.signOutEverywhere({ userId: '507f1f77bcf86cd799439011' }),
      (err) => err.status === 404,
    );
  });
});

// ---------------------------------------------------------------------------
// deleteAccount — irreversible, so it re-proves control of the Google account
// ---------------------------------------------------------------------------

describe('authService.deleteAccount()', () => {
  async function googleUserId() {
    const { token } = await authService.googleLogin(
      { idToken: 'tok', consent: CONSENT },
      verifyAs(),
    );
    return jwt.decode(token).id;
  }

  it('should delete the account when the fresh Google token matches the linked identity', async () => {
    const id = await googleUserId();
    await authService.deleteAccount({ userId: id, idToken: 'fresh' }, verifyAs());
    assert.strictEqual(await userModel.findById(id), null);
  });

  it('should throw 400 and keep the account when idToken is missing', async () => {
    const id = await googleUserId();
    await assert.rejects(
      () => authService.deleteAccount({ userId: id }, verifyAs()),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /idToken is required/);
        return true;
      },
    );
    assert.ok(await userModel.findById(id));
  });

  it('should throw 401 and keep the account when the Google identity is someone else', async () => {
    const id = await googleUserId();
    await assert.rejects(
      () =>
        authService.deleteAccount({ userId: id, idToken: 'fresh' }, verifyAs({ sub: 'other-sub' })),
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /Invalid credentials/);
        return true;
      },
    );
    assert.ok(await userModel.findById(id), 'a mismatched identity must not delete the account');
  });

  it('should throw 401 when the account has no linked Google identity', async () => {
    const { id } = await createUser({ username: 'legacy', email: 'legacy@example.com' });
    await assert.rejects(
      () => authService.deleteAccount({ userId: id, idToken: 'fresh' }, verifyAs()),
      (err) => err.status === 401,
    );
    assert.ok(await userModel.findById(id));
  });

  it('should propagate a rejected Google token as 401 without deleting', async () => {
    const id = await googleUserId();
    const reject = async () => {
      const e = new Error('Invalid Google token');
      e.status = 401;
      throw e;
    };
    await assert.rejects(
      () => authService.deleteAccount({ userId: id, idToken: 'bad' }, reject),
      (err) => err.status === 401,
    );
    assert.ok(await userModel.findById(id));
  });

  it('should throw 404 for an unknown user', async () => {
    await assert.rejects(
      () =>
        authService.deleteAccount({ userId: '507f1f77bcf86cd799439011', idToken: 'x' }, verifyAs()),
      (err) => err.status === 404,
    );
  });
});

// ---------------------------------------------------------------------------
// Profile updates
// ---------------------------------------------------------------------------

describe('authService.updateLanguage()', () => {
  it('should throw 400 when language is missing', async () => {
    const user = await createUser({
      username: 'lng1',
      email: 'lng1@x.com',
    });
    await assert.rejects(
      () => authService.updateLanguage({ id: user.id, language: undefined }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  it('should throw 400 when language is not supported', async () => {
    const user = await createUser({
      username: 'lng2',
      email: 'lng2@x.com',
    });
    await assert.rejects(
      () => authService.updateLanguage({ id: user.id, language: 'fr' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /must be one of/i);
        return true;
      },
    );
  });

  it('should throw 404 when user does not exist', async () => {
    await assert.rejects(
      () => authService.updateLanguage({ id: '000000000000000000000001', language: 'en' }),
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      },
    );
  });

  it('should return a new JWT containing the updated language', async () => {
    const user = await createUser({
      username: 'lng3',
      email: 'lng3@x.com',
    });
    const { token } = await authService.updateLanguage({ id: user.id, language: 'en' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.language, 'en');
    assert.ok(payload.currency, 'token should also carry currency');
  });
});

// ---------------------------------------------------------------------------
// updateOdometer
// ---------------------------------------------------------------------------
describe('authService.updateOdometer()', () => {
  it('should update currentKm when value is greater than current', async () => {
    const user = await userModel.create({
      username: 'driver1',
      email: 'd1@test.com',
    });
    const result = await authService.updateOdometer({ id: user._id.toString(), currentKm: 1000 });
    assert.ok(result.token);
    const after = await userModel.findById(user._id);
    assert.strictEqual(after.currentKm, 1000);
  });

  it('should allow setting currentKm lower than existing', async () => {
    const user = await userModel.create({
      username: 'driver2',
      email: 'd2@test.com',
      currentKm: 500,
    });
    const result = await authService.updateOdometer({ id: user._id.toString(), currentKm: 100 });
    assert.strictEqual(result.currentKm, 100);
  });

  it('should throw 400 when currentKm is missing or invalid', async () => {
    const user = await userModel.create({
      username: 'driver3',
      email: 'd3@test.com',
    });
    await assert.rejects(
      () => authService.updateOdometer({ id: user._id.toString(), currentKm: -1 }),
      (err) => err.status === 400,
    );
  });
});

// ---------------------------------------------------------------------------
// updateCurrency
// ---------------------------------------------------------------------------
describe('authService.updateCurrency()', () => {
  it('should throw 400 when currency is missing', async () => {
    const user = await createUser({
      username: 'cur1',
      email: 'cur1@x.com',
    });
    await assert.rejects(
      () => authService.updateCurrency({ id: user.id, currency: undefined }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  it('should throw 400 when currency is not supported', async () => {
    const user = await createUser({
      username: 'cur2',
      email: 'cur2@x.com',
    });
    await assert.rejects(
      () => authService.updateCurrency({ id: user.id, currency: 'XYZ' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /must be one of/i);
        return true;
      },
    );
  });

  it('should throw 404 when user does not exist', async () => {
    await assert.rejects(
      () => authService.updateCurrency({ id: '000000000000000000000001', currency: 'USD' }),
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      },
    );
  });

  it('should return a JWT containing both currency and language', async () => {
    const user = await createUser({
      username: 'curr_lang',
      email: 'currlang@x.com',
    });
    const { token } = await authService.updateCurrency({ id: user.id, currency: 'USD' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.currency, 'USD');
    assert.ok(payload.language, 'token should also carry language');
  });
});

describe('authService.updateProfitTarget()', () => {
  it('should throw 400 for a negative rate', async () => {
    const user = await createUser({
      username: 'target1',
      email: 'target1@x.com',
    });
    await assert.rejects(
      () => authService.updateProfitTarget({ id: user.id, targetHourlyRate: -5 }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  it('should throw 400 for a non-numeric rate', async () => {
    const user = await createUser({
      username: 'target2',
      email: 'target2@x.com',
    });
    await assert.rejects(
      () => authService.updateProfitTarget({ id: user.id, targetHourlyRate: 'a lot' }),
      (err) => {
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  it('should clear the target when passed null', async () => {
    const user = await createUser({
      username: 'target3',
      email: 'target3@x.com',
    });
    await authService.updateProfitTarget({ id: user.id, targetHourlyRate: 20 });
    const { token } = await authService.updateProfitTarget({
      id: user.id,
      targetHourlyRate: null,
    });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.targetHourlyRate, null);
  });

  it('should return a JWT carrying the new target rate', async () => {
    const user = await createUser({
      username: 'target4',
      email: 'target4@x.com',
    });
    const { token } = await authService.updateProfitTarget({
      id: user.id,
      targetHourlyRate: 25.5,
    });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(payload.targetHourlyRate, 25.5);
  });

  it('should throw 404 when user does not exist', async () => {
    await assert.rejects(
      () =>
        authService.updateProfitTarget({ id: '000000000000000000000001', targetHourlyRate: 10 }),
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------
