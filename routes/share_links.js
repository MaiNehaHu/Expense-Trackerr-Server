const express = require('express');
const router = express.Router();

const { createShareLink, getSharedTransactions } = require('../controllers/share_link');

router.route('/').post(createShareLink);

router.route('/shared/:token').get(getSharedTransactions);

module.exports = router;