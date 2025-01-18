const express = require('express');
const router = express.Router();

const { emptyTrash } = require('../controllers/trash');

router.route('/:id').delete(emptyTrash)

module.exports = router;