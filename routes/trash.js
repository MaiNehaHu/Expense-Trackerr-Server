const express = require('express');
const router = express.Router();

// Import controller functions
const { getAllTrashs, deleteTrash, autoDeleteOlderThanWeek, revertBack } = require('../controllers/trash');

// Route to get all posts
router.route('/:id').get(getAllTrashs)

router.route('/:id').delete(deleteTrash)

router.route('/revert/:id').post(revertBack)

router.route('/older-than-week/:id').delete(autoDeleteOlderThanWeek)

module.exports = router;