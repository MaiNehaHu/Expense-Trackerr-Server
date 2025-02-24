const express = require('express');
const router = express.Router();

const { getAllPeople, addPerson, editPerson, deletePerson } = require('../controllers/people');

router.route('/:id').get(getAllPeople).post(addPerson);

router.route('/:id/:personId').put(editPerson).delete(deletePerson);

module.exports = router;