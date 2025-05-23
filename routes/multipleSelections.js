const express = require('express');
const router = express.Router();

const { deleteSelectedNotifications } = require('../controllers/notifications');
const { deleteSelectedCategories } = require('../controllers/category');

router.route('/notifications/:id').delete(deleteSelectedNotifications)
router.route('/categories/:id').delete(deleteSelectedCategories)

module.exports = router;