const express = require('express');
const router = express.Router();

const { getAllBudgets, addBudget, deleteBudget, editBudget } = require('../controllers/budgets');

router.route('/:id').get(getAllBudgets).post(addBudget);

router.route('/:id/:budgetId').delete(deleteBudget).put(editBudget)

module.exports = router;