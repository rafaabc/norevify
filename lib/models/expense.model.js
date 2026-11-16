const mongoose = require('mongoose');
const { scopedFind, scopedDeleteMany } = require('./queryScope');

const CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Toll', 'Tax', 'Other'];

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    date: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    amount: { type: Number, required: true },
    litres: { type: Number },
    price_per_litre: { type: Number },
    odometer: { type: Number, min: 0 },
    recurringRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        if (ret.vehicleId) ret.vehicleId = ret.vehicleId.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// One generated expense per recurring rule per occurrence date. Catch-up runs from both
// the daily cron and every expenses-page mount, so two runs can overlap and read the same
// lastGeneratedDate — this index makes the database reject the second insert instead of
// storing a duplicate (recurring.service treats E11000 as "already generated").
// Partial: manual expenses have recurringRuleId: null and are not constrained.
expenseSchema.index(
  { recurringRuleId: 1, date: 1 },
  { unique: true, partialFilterExpression: { recurringRuleId: { $type: 'objectId' } } },
);

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

// Mongoose builds schema indexes in the background after connect, so they are not
// guaranteed to exist when the first request lands. Callers that rely on the unique
// index above for correctness await this first; Model.init() is a no-op once built.
// A rejected build is not cached, so the next caller retries it.
let indexesReady = null;
function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = Expense.init().catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  return indexesReady;
}

module.exports = {
  ensureIndexes,
  findAll: () => Expense.find(),
  findById: (id) => Expense.findById(id),
  findByUserId: (userId) => scopedFind(Expense, 'userId', userId),
  findByVehicleId: (vehicleId) => scopedFind(Expense, 'vehicleId', vehicleId),
  create: (data) => Expense.create(data),
  update: (id, data) => Expense.findByIdAndUpdate(id, data, { returnDocument: 'after' }),
  remove: (id) => Expense.findByIdAndDelete(id),
  removeAllByUser: (userId) => scopedDeleteMany(Expense, 'userId', userId),
  _reset: () => Expense.deleteMany({}),
};
