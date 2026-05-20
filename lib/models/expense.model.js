const mongoose = require('mongoose');

const CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Toll', 'Tax', 'Other'];

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    amount: { type: Number, required: true },
    litres: { type: Number },
    price_per_litre: { type: Number },
    odometer: { type: Number, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

module.exports = {
  findAll: () => Expense.find(),
  findById: (id) => Expense.findById(id),
  findByUserId: (userId) => Expense.find({ userId }),
  create: (data) => Expense.create(data),
  update: (id, data) => Expense.findByIdAndUpdate(id, data, { returnDocument: 'after' }),
  remove: (id) => Expense.findByIdAndDelete(id),
  _reset: () => Expense.deleteMany({}),
};
