const express = require('express');
const router = express.Router();
// Cart is managed client-side (localStorage), this endpoint is for validation
router.post('/validate', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { items } = req.body;
    const validated = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product && product.isActive) {
        const sizeObj = product.sizes.find(s => s.size === item.size);
        validated.push({
          product: product._id,
          name: product.name,
          image: product.images[0]?.url,
          price: product.price,
          discountedPrice: product.discountedPrice,
          size: item.size,
          quantity: item.quantity,
          available: sizeObj ? sizeObj.stock >= item.quantity : false
        });
      }
    }
    res.json({ success: true, items: validated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
