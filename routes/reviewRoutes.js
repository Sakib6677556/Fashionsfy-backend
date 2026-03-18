const express = require('express');
const router = express.Router();
const { getProductReviews, addReview } = require('../controllers/miscControllers');
const { protect } = require('../middleware/auth');
router.get('/:productId', getProductReviews);
router.post('/:productId', protect, addReview);
module.exports = router;
