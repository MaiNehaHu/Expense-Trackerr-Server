const express = require('express');
const router = express.Router();

const { getAllNotifications, getTodayNotifications, getMonthNotifications } = require('../controllers/notifications');

router.route('/:id').get(getAllNotifications)

router.route('/today/:id').get(getTodayNotifications)

router.route('/month/:id').get(getMonthNotifications)

module.exports = router;