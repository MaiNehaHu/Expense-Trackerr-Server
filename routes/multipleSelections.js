const express = require('express');
const router = express.Router();

const { deleteSelectedNotifications } = require('../controllers/notifications');
const { deleteSelectedCategories } = require('../controllers/category');
const { deleteSelectedRecurrings } = require('../controllers/recuringTransactions');

router.route('/notifications/:id').delete(deleteSelectedNotifications)
router.route('/categories/:id').delete(deleteSelectedCategories)
router.route('/recurrings/:id').delete(deleteSelectedRecurrings)

module.exports = router;