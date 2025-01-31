const express = require('express');
const router = express.Router();

const { getAnalytics } = require('../controllers/analytics');

router.route('/:id').get(getAnalytics)

module.exports = router;