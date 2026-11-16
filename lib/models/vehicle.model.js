const mongoose = require('./mongooseConfig');
const { scopedFind, scopedDeleteMany, scopedCount } = require('./queryScope');

const vehicleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 50 },
    currentKm: { type: Number, default: 0, min: 0 },
    currentKmUpdatedAt: { type: Date },
    // Concurrency guard, never shown to clients. At most one vehicle per user may carry a
    // given guardKey (unique partial index below), which makes "free plan = 1 vehicle" and
    // "one auto-created default vehicle" hold even when requests race: the loser's insert
    // fails with E11000 instead of both passing a count-then-insert check.
    guardKey: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret.guardKey;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

vehicleSchema.index(
  { userId: 1, guardKey: 1 },
  { unique: true, partialFilterExpression: { guardKey: { $type: 'string' } } },
);

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

// Mongoose builds schema indexes in the background after connect, so the unique index above
// is not guaranteed to exist when the first request lands; create() awaits this first.
// Model.init() is a no-op once built, and a rejected build is not cached (retried next call).
let indexesReady = null;
function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = Vehicle.init().catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  return indexesReady;
}

module.exports = {
  findById: (id) => Vehicle.findById(id),
  findByUserId: (userId) => scopedFind(Vehicle, 'userId', userId).sort({ createdAt: 1, _id: 1 }),
  countByUserId: (userId) => scopedCount(Vehicle, 'userId', userId),
  create: async (data) => {
    await ensureIndexes();
    return Vehicle.create(data);
  },
  update: (id, data) => Vehicle.findByIdAndUpdate(id, data, { returnDocument: 'after' }),
  remove: (id) => Vehicle.findByIdAndDelete(id),
  removeAllByUser: (userId) => scopedDeleteMany(Vehicle, 'userId', userId),
  updateOdometerAndReturn: (id, currentKm) =>
    Vehicle.findOneAndUpdate(
      { _id: id },
      { $set: { currentKm, currentKmUpdatedAt: new Date() } },
      { returnDocument: 'after' },
    ),
  _reset: () => Vehicle.deleteMany({}),
};
