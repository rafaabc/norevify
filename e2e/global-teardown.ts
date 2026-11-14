import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { RUN_TAG, RUN_USERNAME_PREFIX } from './fixtures/test-data';

// Users older than this belong to a run that died before teardown (CI runs take minutes).
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

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

    // Only this run's users (username tag) plus stale leftovers from runs that died
    // before teardown. Never touch recent users of other runs: test-api and other PRs'
    // e2e jobs now share this DB concurrently.
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
    const testUsers = await db
      .collection('users')
      .find(
        {
          email: /@test\.com$/,
          $or: [
            { username: new RegExp(`^${RUN_USERNAME_PREFIX}`) },
            { createdAt: { $lt: staleBefore } },
          ],
        },
        { projection: { _id: 1 } },
      )
      .toArray();

    if (testUsers.length > 0) {
      const ids = testUsers.map((u) => u._id);
      await db.collection('expenses').deleteMany({ userId: { $in: ids } });
      await db.collection('reminders').deleteMany({ userId: { $in: ids } });
      await db.collection('users').deleteMany({ _id: { $in: ids } });
    }

    // Orphaned reminders, only old ones: a recent reminder whose user is absent from this
    // snapshot may belong to a user another run created a moment ago.
    const allUserIds = await db
      .collection('users')
      .find({}, { projection: { _id: 1 } })
      .toArray()
      .then((docs) => docs.map((d) => d._id.toString()));

    const orphanResult = await db.collection('reminders').deleteMany({
      createdAt: { $lt: staleBefore },
      $expr: {
        $not: { $in: [{ $toString: '$userId' }, allUserIds] },
      },
    });

    const orphanCount = orphanResult.deletedCount ?? 0;
    console.log(
      `[e2e teardown] Cleaned up ${testUsers.length} test user(s) (tag ${RUN_TAG} + stale), their expenses and reminders.`,
    );
    if (orphanCount > 0) console.log(`[e2e teardown] Removed ${orphanCount} orphaned reminder(s).`);
  } catch (err) {
    console.warn('[e2e teardown] Cleanup warning:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}
