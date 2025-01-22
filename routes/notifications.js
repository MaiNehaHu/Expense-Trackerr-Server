const express = require('express');
const router = express.Router();

const { getAllNotifications, getTodayNotifications } = require('../controllers/notifications');

router.route('/:id').get(getAllNotifications)

router.route('/today/:id').get(getTodayNotifications)

module.exports = router;