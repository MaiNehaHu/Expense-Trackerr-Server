const express = require('express');
const router = express.Router();

// Import controller functions
const { getAllTrashs, deleteTrash } = require('../controllers/trash');

// Route to get all posts
router.route('/:id').get(getAllTrashs)

router.route('/:id/:trashTransactionId').delete(deleteTrash)

module.exports = router;