const express = require('express');
const router = express.Router();

const { checkAndProcessRecurring, getAllRecurings, addRecuring, deleteRecuring, editRecuring } = require('../controllers/recurings');

router.route('/:id').get(getAllRecurings).post(addRecuring);

router.route('/push-recursion/:id').post(checkAndProcessRecurring);

router.route('/:id/:recuringId').delete(deleteRecuring).put(editRecuring);

module.exports = router;