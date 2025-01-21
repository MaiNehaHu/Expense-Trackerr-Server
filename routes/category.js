const express = require('express');
const router = express.Router();

const { getAllCategories, addCategory, editCategory, deleteCategory } = require('../controllers/category');

router.route('/:id').get(getAllCategories).post(addCategory);

router.route('/:id/:categoryId').put(editCategory).delete(deleteCategory);

module.exports = router;