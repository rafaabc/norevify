import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DEFAULT_PASSWORD, uniqueUsername, todayISO } from './test-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function markEmailVerified(userId: string): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
  await mongoose.connection
    .db!.collection('users')
    .updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { emailVerified: true } });
}

export async function createAndLoginUser(
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
