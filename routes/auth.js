const express = require('express');
const router = express.Router();

const { authenticateUser } = require('../controllers/auth');

router.route('/').post(authenticateUser)

module.exports = router;