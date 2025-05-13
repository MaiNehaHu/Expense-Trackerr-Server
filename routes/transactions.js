const express = require('express');
const router = express.Router();

// Import controller functions
const { addTransaction, getAllTransactions, editTransaction, deleteTransaction, checkAndPushReminder } = require('../controllers/transactions');

// Route to get all posts
router.route('/:id').post(addTransaction)

router.route('/push-reminder/:id').post(checkAndPushReminder)

router.route('/:id').get(getAllTransactions)

router.route('/:id').put(editTransaction).delete(deleteTransaction);

module.exports = router;