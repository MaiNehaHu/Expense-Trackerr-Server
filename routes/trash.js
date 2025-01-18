const express = require('express');
const router = express.Router();

// Import controller functions
const { getAllTrashs, deleteTrash, emptyTrash } = require('../controllers/trash');

// Route to get all posts
router.route('/:id').get(getAllTrashs)

router.route('/:id').delete(deleteTrash)

router.route('/clean/:id').delete(emptyTrash)

module.exports = router;