const express = require('express');
const router = express.Router();

const { loginUser } = require('../controllers/authentication');

router.route('/login').get(loginUser)

module.exports = router;