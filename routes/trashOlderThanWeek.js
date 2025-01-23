const express = require('express');
const router = express.Router();

// Import controller functions
const { autoDeleteOlderThanWeek } = require('../controllers/trash');

// Route to get delete all old transactions
router.route('/:id').delete(autoDeleteOlderThanWeek)

module.exports = router;