import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default async function globalTeardown(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[e2e teardown] MONGODB_URI not set — skipping cleanup');
    return;
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db!;

    const testUsers = await db
      .collection('users')
      .find({ email: /@test\.com$/ }, { projection: { _id: 1 } })
      .toArray();

    if (testUsers.length === 0) {
      console.log('[e2e teardown] No test users found.');
      return;
    }

    const ids = testUsers.map((u) => u._id);
    await db.collection('expenses').deleteMany({ userId: { $in: ids } });
    await db.collection('users').deleteMany({ _id: { $in: ids } });

    console.log(`[e2e teardown] Cleaned up ${testUsers.length} test user(s) and their expenses.`);
  } catch (err) {
    console.warn('[e2e teardown] Cleanup warning:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}
