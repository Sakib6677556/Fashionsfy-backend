// wishlistRoutes.js
const express = require('express');
const r1 = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/miscControllers');
const { protect } = require('../middleware/auth');
r1.get('/', protect, getWishlist);
r1.post('/:productId', protect, toggleWishlist);
module.exports = r1;
