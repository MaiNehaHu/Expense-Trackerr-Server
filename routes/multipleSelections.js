const express = require('express');
const router = express.Router();

const { deleteSelectedNotifications } = require('../controllers/notifications');

router.route('/notifications/:id').delete(deleteSelectedNotifications)

module.exports = router;