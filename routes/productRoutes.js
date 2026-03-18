const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, upload.array('images', 6), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
