const express = require('express');
const router = express.Router();

const { getAllNotifications } = require('../controllers/notifications');

router.route('/:id').get(getAllNotifications)

module.exports = router;