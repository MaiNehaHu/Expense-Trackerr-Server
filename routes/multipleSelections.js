const express = require('express');
const router = express.Router();

const { deleteSelectedNotifications } = require('../controllers/notifications');
const { deleteSelectedCategories } = require('../controllers/category');
const { deleteSelectedRecurrings } = require('../controllers/recuringTransactions');
const { deleteSelectedPeople } = require('../controllers/people');
const { deleteSelectedTrashTrans, revertSelectedTrashTrans } = require('../controllers/trash');
const { deleteSelectedTransactions } = require('../controllers/transactions');

router.route('/notifications/:id').delete(deleteSelectedNotifications)
router.route('/categories/:id').delete(deleteSelectedCategories)
router.route('/recurrings/:id').delete(deleteSelectedRecurrings)
router.route('/people/:id').delete(deleteSelectedPeople)
router.route('/trash/:id').delete(deleteSelectedTrashTrans)
router.route('/transactions/:id').delete(deleteSelectedTransactions)
router.route('/revert-trash/:id').delete(revertSelectedTrashTrans)

module.exports = router;