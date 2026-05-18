const remindersService = require('../services/reminders.service');

function wrap(fn) {
  return async (req, res) => {
    try { res.status(200).json(await fn(req)); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
  };
}

async function create(req, res) {
  try {
    const r = await remindersService.createReminder(req.user.id, req.body);
    res.status(201).json(r);
  } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
}

const list        = wrap((req) => remindersService.listReminders(req.user.id, req.query));
const getOne      = wrap((req) => remindersService.getReminder(req.user.id, req.params.id));
const update      = wrap((req) => remindersService.updateReminder(req.user.id, req.params.id, req.body));
const complete    = wrap((req) => remindersService.completeReminder(req.user.id, req.params.id, req.body));
const badgeCount  = wrap((req) => remindersService.getBadgeCount(req.user.id));

async function remove(req, res) {
  try {
    await remindersService.deleteReminder(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
}

module.exports = { create, list, getOne, update, complete, badgeCount, remove };
