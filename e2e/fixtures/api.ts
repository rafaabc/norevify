import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { assertTestDb } from '../../test/helpers/assertTestDb.js';
import { seedUser, tokenFor } from '../../test/helpers/seedUser.js';

// Re-issues a session JWT for a seeded user from its current DB state, like signing in again.
export const mintToken = (username: string): Promise<string> => tokenFor(username);
import { DEFAULT_PASSWORD, uniqueUsername, todayISO } from './test-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function markEmailVerified(userId: string): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  assertTestDb(uri);
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
  await mongoose.connection
    .db!.collection('users')
    .updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { emailVerified: true } });
}

// Seeds a verified user straight into the `_test` database and mints its session JWT
// (test/helpers/seedUser.js) — no register/login round-trip, so specs that only need
// an authenticated session don't depend on the password path. The `request` argument
// is kept so call sites don't change; seeding doesn't use it. Users carry the
// uniqueUsername() run tag, so global-teardown still sweeps them.
export async function createAndLoginUser(
  _request: APIRequestContext,
  prefix = 'user',
): Promise<{ username: string; token: string }> {
  const { username, token } = await seedUser(uniqueUsername(prefix));
  return { username, token };
}

// Registers + logs in over HTTP exactly as a real client does. Only for specs that
// exercise password login itself (they need a real password to type into the form).
export async function registerPasswordUser(
  request: APIRequestContext,
  prefix = 'user',
): Promise<{ username: string; token: string }> {
  const username = uniqueUsername(prefix);
  const regRes = await request.post('/api/auth/register', {
    data: {
      username,
      password: DEFAULT_PASSWORD,
      email: `${username}@test.com`,
      consent: { policyVersion: '2026-05-20', acceptedAt: new Date().toISOString() },
    },
  });
  const { id } = await regRes.json();
  if (id) await markEmailVerified(id);

  const res = await request.post('/api/auth/login', {
    data: { username, password: DEFAULT_PASSWORD },
  });
  const { token } = await res.json();
  return { username, token };
}

export async function createExpenseViaApi(
  request: APIRequestContext,
  token: string,
  data: Record<string, unknown>,
): Promise<{ id: number; category: string; amount: number; [key: string]: unknown }> {
  const payload = { date: todayISO(), ...data };
  const res = await request.post('/api/expenses', {
    data: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
