// categoryRoutes.js
const express = require('express');
const r = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/auth');
r.get('/', getCategories);
r.post('/', protect, adminOnly, createCategory);
r.put('/:id', protect, adminOnly, updateCategory);
r.delete('/:id', protect, adminOnly, deleteCategory);
module.exports = r;
