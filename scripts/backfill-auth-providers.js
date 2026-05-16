'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await mongoose.connection.collection('users').updateMany(
    { authProviders: { $exists: false } },
    { $set: { authProviders: ['password'] } }
  );

  console.log(`Updated ${result.modifiedCount} user(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
