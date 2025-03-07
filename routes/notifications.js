const express = require('express');
const router = express.Router();

const { getAllNotifications, getTodayNotifications, getMonthNotifications, editNotifcationTransaction } = require('../controllers/notifications');

router.route('/:id').get(getAllNotifications)

router.route('/today/:id').get(getTodayNotifications)

router.route('/month/:id').get(getMonthNotifications)

router.route('/:id/:transactionId').put(editNotifcationTransaction)

module.exports = router;