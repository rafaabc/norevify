const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const userModel = require('../../src/models/user.model');
const expenseModel = require('../../src/models/expense.model');
const reminderModel = require('../../src/models/reminder.model');

let mongod;

async function startMongo() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function stopMongo() {
  await mongoose.disconnect();
  await mongod.stop();
}

async function resetMongo() {
  await userModel._reset();
  await expenseModel._reset();
  await reminderModel._reset();
}

module.exports = { startMongo, stopMongo, resetMongo };
