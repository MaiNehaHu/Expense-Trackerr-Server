const express = require('express');
const router = express.Router();

const { getAllNotifications, getTodayNotifications, getMonthNotifications, editNotifcationTransaction, deleteNotification, deleteAllNotifications } = require('../controllers/notifications');

router.route('/:id').get(getAllNotifications)

router.route('/:id').delete(deleteAllNotifications)

router.route('/today/:id').get(getTodayNotifications)

router.route('/month/:id').get(getMonthNotifications)

router.route('/:id/:notificationId').put(editNotifcationTransaction)

router.route('/:id/:notificationId').delete(deleteNotification)

module.exports = router;