const express = require('express');
const router = express.Router();

const { getSearchResults } = require('../controllers/search');

router.route('/:id/:searchKeyWord').get(getSearchResults).post(getSearchResults);

module.exports = router;