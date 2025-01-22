const express = require('express');
const router = express.Router();

const { getAllBudgets, addBudget, deleteBudget } = require('../controllers/budgets');

router.route('/:id').get(getAllBudgets).post(addBudget);

router.route('/:id/:budgetId').delete(deleteBudget)

module.exports = router;