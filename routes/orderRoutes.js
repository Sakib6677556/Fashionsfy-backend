const express = require('express');
const router = express.Router();
const {
  createOrder, getUserOrders, getOrder,
  getAllOrders, updateOrderStatus, updatePaymentStatus, getAdminStats
} = require('../controllers/orderController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { uploadPayment } = require('../config/cloudinary');

router.post('/', optionalAuth, uploadPayment.single('paymentScreenshot'), createOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/stats', protect, adminOnly, getAdminStats);
router.get('/:id', optionalAuth, getOrder);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/payment', protect, adminOnly, updatePaymentStatus);

module.exports = router;
