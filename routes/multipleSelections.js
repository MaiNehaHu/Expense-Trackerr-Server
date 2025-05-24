const express = require('express');
const router = express.Router();

const { deleteSelectedNotifications } = require('../controllers/notifications');
const { deleteSelectedCategories } = require('../controllers/category');
const { deleteSelectedRecurrings } = require('../controllers/recuringTransactions');
const { deleteSelectedPeople } = require('../controllers/people');
const { deleteSelectedTrashTrans } = require('../controllers/trash');
const { deleteSelectedSearchedTrans } = require('../controllers/search');

router.route('/notifications/:id').delete(deleteSelectedNotifications)
router.route('/categories/:id').delete(deleteSelectedCategories)
router.route('/recurrings/:id').delete(deleteSelectedRecurrings)
router.route('/people/:id').delete(deleteSelectedPeople)
router.route('/trash/:id').delete(deleteSelectedTrashTrans)
router.route('/search/:id').delete(deleteSelectedSearchedTrans)

module.exports = router;