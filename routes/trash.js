const express = require('express');
const router = express.Router();

// Import controller functions
const { getAllTrashs, deleteTrash, autoDeleteOlderThanWeek } = require('../controllers/trash');

// Route to get all posts
router.route('/:id').get(getAllTrashs)

router.route('/:id/:trashTransactionId').delete(deleteTrash)

router.route('/older-than-week/:id').delete(autoDeleteOlderThanWeek)

module.exports = router;