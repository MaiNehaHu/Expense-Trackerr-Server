const express = require('express');
const router = express.Router();

// Import controller functions
const { addTrash, getAllTrashs, editTrash, deleteTrash, emptyTrash } = require('../controllers/transactions');

// Route to get all posts
// router.route('/').get(getAllTrashs).post(addTrash)

// router.route('/delete').put(editTrash).delete(deleteTrash).delete(emptyTrash)

module.exports = router;