// One-off cleanup: deletes user-owned documents whose `userId` no longer matches any
// user. Before #278 isolated test-api/e2e onto `norevify_test`, CI runs registered
// users in the production database; teardown removed the users but not everything
// they owned (mostly auto-created "My Vehicle" documents), so these rows are
// unreachable by any account.
//
//   node scripts/delete-orphaned-user-data.mjs            # dry run: report only, writes nothing
//   node scripts/delete-orphaned-user-data.mjs --apply    # export orphans to a JSON file, then delete them
//
// Reads MONGODB_URI (from the environment or .env). To target production, pass its URI
// explicitly for this one command rather than editing .env:
//   MONGODB_URI='mongodb+srv://…/norevify' node scripts/delete-orphaned-user-data.mjs
//
// Safety:
// - Refuses to run when the users collection is empty — against the wrong database
//   (or a missing users collection) every document would look orphaned.
// - Only documents created before this script started are eligible, so data from an
//   account signing up mid-run is never touched.
// - --apply deletes by the exact _id list found in this run (not by a predicate), after
//   re-checking that none of those userIds has appeared in the users collection since.
// - --apply writes every document it is about to delete to a JSON file in the OS temp
//   directory first, so a mistake can be re-inserted.
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mongoose from 'mongoose';

// EJSON (canonical) keeps ObjectId/Date types so the export can be re-inserted as-is.
const { EJSON } = mongoose.mongo.BSON;

const COLLECTIONS = ['vehicles', 'expenses', 'incomes', 'reminders', 'recurringrules'];

const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

const startedAt = new Date();

function orphanPipeline() {
  return [
    { $match: { createdAt: { $lt: startedAt } } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'owner' } },
    { $match: { owner: { $size: 0 } } },
    { $project: { owner: 0 } },
  ];
}

function describe(docs) {
  if (docs.length === 0) return '0';
  const userIds = new Set(docs.map((d) => String(d.userId)));
  const times = docs.map((d) => d.createdAt?.getTime()).filter(Number.isFinite);
  const range = times.length
    ? `${new Date(Math.min(...times)).toISOString()} → ${new Date(Math.max(...times)).toISOString()}`
    : 'no createdAt';
  return `${docs.length} (from ${userIds.size} missing user(s), created ${range})`;
}

await mongoose.connect(uri);
try {
  const db = mongoose.connection.db;
  const userCount = await db.collection('users').countDocuments({});
  console.log(`database: ${mongoose.connection.name} — ${userCount} users`);
  if (userCount === 0) {
    console.error('users collection is empty — refusing to run (wrong database?)');
    process.exitCode = 1;
  } else {
    const found = {};
    for (const name of COLLECTIONS) {
      const docs = await db.collection(name).aggregate(orphanPipeline()).toArray();
      found[name] = docs;
      console.log(`  ${name}: ${describe(docs)}`);
    }

    const total = Object.values(found).reduce((n, docs) => n + docs.length, 0);
    if (total === 0) {
      console.log('nothing to delete.');
    } else if (!apply) {
      console.log(`dry run — nothing written. ${total} orphaned document(s) would be deleted.`);
      console.log('Re-run with --apply to export them to a JSON file and delete them.');
    } else {
      // Re-check: a missing userId that now exists means a user appeared since the scan.
      const userIds = [
        ...new Set(Object.values(found).flatMap((docs) => docs.map((d) => String(d.userId)))),
      ].map((id) => new mongoose.Types.ObjectId(id));
      const reappeared = await db.collection('users').countDocuments({ _id: { $in: userIds } });
      if (reappeared > 0) {
        console.error(`${reappeared} owner(s) now exist — aborting, nothing deleted. Re-run.`);
        process.exitCode = 1;
      } else {
        const file = join(
          tmpdir(),
          `norevify-orphans-${startedAt.toISOString().replaceAll(':', '-')}.json`,
        );
        writeFileSync(file, EJSON.stringify(found, { relaxed: false }, 2));
        console.log(`exported ${total} document(s) to ${file}`);

        for (const name of COLLECTIONS) {
          const ids = found[name].map((d) => d._id);
          if (ids.length === 0) continue;
          const res = await db.collection(name).deleteMany({ _id: { $in: ids } });
          console.log(`  ${name}: deleted ${res.deletedCount} of ${ids.length}`);
        }
      }
    }
  }
} finally {
  await mongoose.disconnect();
}
