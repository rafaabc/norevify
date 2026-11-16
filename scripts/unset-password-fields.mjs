// One-off cleanup after username/password sign-in was removed (Google is the only
// sign-in method). Unsets the fields only the password path used, so no password
// hashes linger in the database.
//
//   node scripts/unset-password-fields.mjs            # dry run: counts only, writes nothing
//   node scripts/unset-password-fields.mjs --apply    # performs the $unset
//
// Reads MONGODB_URI (from the environment or .env). Run it against production
// deliberately, after the deploy that removed the password code is live.
import 'dotenv/config';
import mongoose from 'mongoose';

const FIELDS = [
  'password',
  'failedLoginAttempts',
  'lockUntil',
  'emailVerificationToken',
  'emailVerificationExpiresAt',
  'authProviders',
];

const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

await mongoose.connect(uri);
try {
  const users = mongoose.connection.db.collection('users');
  const total = await users.countDocuments({});
  console.log(`database: ${mongoose.connection.name} — ${total} users`);

  for (const field of FIELDS) {
    const n = await users.countDocuments({ [field]: { $exists: true } });
    console.log(`  ${field}: ${n} document(s) still carry it`);
  }

  if (!apply) {
    console.log('dry run — nothing written. Re-run with --apply to unset these fields.');
  } else {
    const res = await users.updateMany(
      {},
      { $unset: Object.fromEntries(FIELDS.map((f) => [f, ''])) },
    );
    console.log(`applied: modified ${res.modifiedCount} document(s)`);
  }
} finally {
  await mongoose.disconnect();
}
