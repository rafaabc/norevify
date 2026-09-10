import mongoose from 'mongoose';

let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  // A connection established outside this cache (e.g. test/helpers/mongo.js's
  // startMongo(), which calls mongoose.connect() directly against an in-memory
  // instance) already leaves the default mongoose connection ready — reuse it
  // instead of dialing process.env.MONGODB_URI again, which is unset there.
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
