const express = require('express');
const router = express.Router();

const { checkAndaddRecuring, getAllRecurings, addRecuring, deleteRecuring, editRecuring } = require('../controllers/recurings');

router.route('/:id').get(getAllRecurings).post(addRecuring);

router.route('/push-recursion/:id').post(checkAndaddRecuring);

router.route('/:id/:recuringId').delete(deleteRecuring).put(editRecuring);

module.exports = router;