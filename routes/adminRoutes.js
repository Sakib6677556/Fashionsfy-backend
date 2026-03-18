const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');

router.get('/users', protect, adminOnly, getAllUsers);

router.put('/users/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const User = require('../models/User');
    const Category = require('../models/Category');
    const { Banner, DeliverySettings } = require('../models/Others');

    // Create admin
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@fashionstore.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin'
      });
    }

    // Seed categories
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const cats = [
        { name: "Men's Fashion", slug: 'mens-fashion', order: 1 },
        { name: "Women's Fashion", slug: 'womens-fashion', order: 2 },
        { name: "Kids' Wear", slug: 'kids-wear', order: 3 },
        { name: 'Accessories', slug: 'accessories', order: 4 },
        { name: 'Footwear', slug: 'footwear', order: 5 },
        { name: 'Bags', slug: 'bags', order: 6 },
      ];
      await Category.insertMany(cats);
    }

    // Seed delivery settings
    const delCount = await DeliverySettings.countDocuments();
    if (delCount === 0) {
      await DeliverySettings.create({ insideDhaka: 60, outsideDhaka: 120 });
    }

    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
