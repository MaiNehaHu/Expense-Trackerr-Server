const express = require('express');
const router = express.Router();

const { checkAndAddRecuringTransactions, getAllRecuringTransactions, addRecuringTransactions, deleteRecuringTransaction, editRecuringTransactions } = require('../controllers/recuringTransactions');

router.route('/:id').get(getAllRecuringTransactions).post(addRecuringTransactions);

router.route('/push-recursion/:id').post(checkAndAddRecuringTransactions);

router.route('/:id/:recuringtransactionId').delete(deleteRecuringTransaction).put(editRecuringTransactions);

module.exports = router;