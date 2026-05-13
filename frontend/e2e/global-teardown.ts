import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readAndClearIds } from './fixtures/tracked-users';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export default async function globalTeardown(): Promise<void> {
  const ids = readAndClearIds();
  if (ids.length === 0) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[e2e teardown] MONGODB_URI not set — skipping cleanup');
    return;
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db!;
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

    await db.collection('expenses').deleteMany({ userId: { $in: objectIds } });
    await db.collection('users').deleteMany({ _id: { $in: objectIds } });

    console.log(`[e2e teardown] Cleaned up ${ids.length} test user(s) and their expenses.`);
  } catch (err) {
    console.warn('[e2e teardown] Cleanup warning:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}
