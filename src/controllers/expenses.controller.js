const expensesService = require('../services/expenses.service');

async function create(req, res) {
  try {
    const expense = await expensesService.createExpense(req.user.id, req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const expenses = await expensesService.listExpenses(req.user.id, req.query);
    res.status(200).json(expenses);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function summary(req, res) {
  try {
    const result = await expensesService.getSummary(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function getOne(req, res) {
  try {
    const expense = await expensesService.getExpense(req.user.id, req.params.id);
    res.status(200).json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const expense = await expensesService.updateExpense(req.user.id, req.params.id, req.body);
    res.status(200).json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    await expensesService.deleteExpense(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { create, list, summary, getOne, update, remove };
