import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import { seedUser, tokenFor } from '../../test/helpers/seedUser.js';

// Re-issues a session JWT for a seeded user from its current DB state, like signing in again.
export const mintToken = (username: string): Promise<string> => tokenFor(username);
import { uniqueUsername, todayISO } from './test-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
