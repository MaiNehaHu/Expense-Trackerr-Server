const express = require('express');
const router = express.Router();

// Import controller functions
const { addTransaction, getAllTransactions, editTransaction, deleteTransaction } = require('../controllers/transactions');

// Route to get all posts
router.route('/').get(getAllTransactions).post(addTransaction)

router.route('/delete').put(editTransaction).delete(deleteTransaction)

module.exports = router;