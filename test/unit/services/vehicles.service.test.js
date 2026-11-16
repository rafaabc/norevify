'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { startMongo, stopMongo, resetMongo } = require('../../helpers/mongo');
const vehiclesService = require('../../../lib/services/vehicles.service');
const userModel = require('../../../lib/models/user.model');

before(async () => await startMongo());
after(async () => await stopMongo());
beforeEach(async () => await resetMongo());

const USER_ID = () => new mongoose.Types.ObjectId().toString();

describe('vehiclesService.createVehicle()', () => {
  it('creates a vehicle for a free user with none yet', async () => {
    const u = USER_ID();
    const vehicle = await vehiclesService.createVehicle(u, { name: 'Civic' });
    assert.strictEqual(vehicle.name, 'Civic');
  });

  it('rejects a 2nd vehicle for a free-plan user with 402', async () => {
    const u = USER_ID();
    await userModel.create({ _id: u, username: 'free1', password: 'x', email: 'free1@test.com' });
    await vehiclesService.createVehicle(u, { name: 'Civic' });
    await assert.rejects(
      () => vehiclesService.createVehicle(u, { name: 'Corolla' }),
      (err) => {
        assert.strictEqual(err.status, 402);
        assert.match(err.message, /vehicle_limit_reached/);
        return true;
      },
    );
  });

  it('allows unlimited vehicles for a pro-plan user', async () => {
    const u = USER_ID();
    await userModel.create({
      _id: u,
      username: 'pro1',
      password: 'x',
      email: 'pro1@test.com',
      plan: 'pro',
    });
    await vehiclesService.createVehicle(u, { name: 'Civic' });
    const second = await vehiclesService.createVehicle(u, { name: 'Corolla' });
    assert.strictEqual(second.name, 'Corolla');
  });

  it('rejects a name over 50 characters on create, accepts exactly 50', async () => {
    const u = USER_ID();
    await assert.rejects(
      () => vehiclesService.createVehicle(u, { name: 'x'.repeat(51) }),
      (err) => err.status === 400 && /at most 50/.test(err.message),
    );
    const ok = await vehiclesService.createVehicle(u, { name: 'x'.repeat(50) });
    assert.strictEqual(ok.name.length, 50);
  });

  it('rejects a non-string name with 400', async () => {
    const u = USER_ID();
    await assert.rejects(
      () => vehiclesService.createVehicle(u, { name: { $gt: '' } }),
      (err) => err.status === 400,
    );
  });

  it('rejects a name over 50 characters on update', async () => {
    const u = USER_ID();
    const v = await vehiclesService.createVehicle(u, { name: 'Civic' });
    await assert.rejects(
      () => vehiclesService.updateVehicle(u, v.id, { name: 'x'.repeat(51) }),
      (err) => err.status === 400,
    );
  });

  it('rejects when name is missing', async () => {
    const u = USER_ID();
    await assert.rejects(
      () => vehiclesService.createVehicle(u, {}),
      (err) => err.status === 400,
    );
  });
});

describe('vehiclesService.resolveVehicleId()', () => {
  it('auto-creates a default vehicle when the user has none', async () => {
    const u = USER_ID();
    const vehicle = await vehiclesService.resolveVehicleId(u, undefined);
    assert.strictEqual(vehicle.name, 'My Vehicle');
  });

  it('reuses the same default vehicle on subsequent calls', async () => {
    const u = USER_ID();
    const first = await vehiclesService.resolveVehicleId(u, undefined);
    const second = await vehiclesService.resolveVehicleId(u, undefined);
    assert.strictEqual(first.id, second.id);
  });

  it('does not count the auto-created default vehicle against the free-tier gate', async () => {
    const u = USER_ID();
    await userModel.create({ _id: u, username: 'free2', password: 'x', email: 'free2@test.com' });
    await vehiclesService.resolveVehicleId(u, undefined);
    // free tier still allows exactly 1 explicit vehicle — but one already exists (the
    // auto-created default), so an explicit create should now hit the same 402 gate.
    await assert.rejects(
      () => vehiclesService.createVehicle(u, { name: 'Second' }),
      (err) => err.status === 402,
    );
  });

  it('throws 404 when an explicit vehicleId does not belong to the user', async () => {
    const u = USER_ID();
    const other = USER_ID();
    const vehicle = await vehiclesService.createVehicle(other, { name: 'NotMine' });
    await assert.rejects(
      () => vehiclesService.resolveVehicleId(u, vehicle.id),
      (err) => err.status === 404,
    );
  });
});

describe('vehiclesService.updateOdometer()', () => {
  it('raises currentKm; older reading does not lower it', async () => {
    const u = USER_ID();
    const vehicle = await vehiclesService.createVehicle(u, { name: 'Civic' });
    await vehiclesService.updateOdometer(vehicle.id, 1000);
    await vehiclesService.updateOdometer(vehicle.id, 500);
    const updated = await vehiclesService.getVehicle(u, vehicle.id);
    assert.strictEqual(updated.currentKm, 1000);
  });
});

describe('vehiclesService — manual currentKm override', () => {
  it('createVehicle accepts an initial currentKm', async () => {
    const u = USER_ID();
    const vehicle = await vehiclesService.createVehicle(u, { name: 'Civic', currentKm: 5000 });
    assert.strictEqual(vehicle.currentKm, 5000);
  });

  it('updateVehicle allows manually setting currentKm to a lower value', async () => {
    const u = USER_ID();
    const vehicle = await vehiclesService.createVehicle(u, { name: 'Civic', currentKm: 5000 });
    const updated = await vehiclesService.updateVehicle(u, vehicle.id, { currentKm: 1000 });
    assert.strictEqual(updated.currentKm, 1000);
  });

  it('rejects a negative currentKm', async () => {
    const u = USER_ID();
    await assert.rejects(
      () => vehiclesService.createVehicle(u, { name: 'Civic', currentKm: -5 }),
      (err) => err.status === 400,
    );
  });
});

describe('vehiclesService.deleteAllByUser()', () => {
  it('deletes all vehicles for the given userId', async () => {
    const u = USER_ID();
    const other = USER_ID();
    await vehiclesService.createVehicle(u, { name: 'Mine' });
    await vehiclesService.createVehicle(other, { name: 'TheirsAlso' });
    await vehiclesService.deleteAllByUser(u);
    assert.strictEqual((await vehiclesService.listVehicles(u)).length, 0);
    assert.strictEqual((await vehiclesService.listVehicles(other)).length, 1);
  });
});

describe('vehiclesService.deleteVehicle()', () => {
  const expenseModel = require('../../../lib/models/expense.model');
  const incomeModel = require('../../../lib/models/income.model');
  const reminderModel = require('../../../lib/models/reminder.model');
  const recurringRuleModel = require('../../../lib/models/recurringRule.model');

  it('deletes a vehicle that has no records', async () => {
    const u = USER_ID();
    const v = await vehiclesService.createVehicle(u, { name: 'Empty' });
    await vehiclesService.deleteVehicle(u, v.id);
    assert.strictEqual((await vehiclesService.listVehicles(u)).length, 0);
  });

  // Deleting a vehicle used to leave its records pointing at a vehicle that no longer
  // exists: km-based reminders then read currentKm 0 and never went overdue, and
  // per-vehicle filters/reports silently dropped the rows.
  const RECORD_KINDS = {
    expense: (userId, vehicleId) =>
      expenseModel.create({ userId, vehicleId, date: new Date(), category: 'Toll', amount: 5 }),
    income: (userId, vehicleId) =>
      incomeModel.create({ userId, vehicleId, date: new Date(), amount: 50, source: 'Uber' }),
    reminder: (userId, vehicleId) =>
      reminderModel.create({ userId, vehicleId, type: 'Maintenance', dueKm: 10000 }),
    'recurring rule': (userId, vehicleId) =>
      recurringRuleModel.create({
        userId,
        vehicleId,
        category: 'Insurance',
        amount: 100,
        startDate: new Date(),
        interval: 1,
        dayOfMonth: 1,
      }),
  };

  for (const [kind, createRecord] of Object.entries(RECORD_KINDS)) {
    it(`refuses with 409 vehicle_in_use while the vehicle still has a ${kind}`, async () => {
      const u = USER_ID();
      const v = await vehiclesService.createVehicle(u, { name: 'Used' });
      await createRecord(u, v._id);
      await assert.rejects(
        () => vehiclesService.deleteVehicle(u, v.id),
        (err) => err.status === 409 && err.message === 'vehicle_in_use',
      );
      assert.strictEqual((await vehiclesService.listVehicles(u)).length, 1);
    });
  }

  it("404s on another user's vehicle without revealing whether it has records", async () => {
    const owner = USER_ID();
    const v = await vehiclesService.createVehicle(owner, { name: 'Theirs' });
    await RECORD_KINDS.expense(owner, v._id);
    await assert.rejects(
      () => vehiclesService.deleteVehicle(USER_ID(), v.id),
      (err) => err.status === 404,
    );
  });
});
