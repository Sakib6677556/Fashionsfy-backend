const Order = require('../models/Order');
const Product = require('../models/Product');
const { Coupon, DeliverySettings } = require('../models/Others');
const { cloudinary } = require('../config/cloudinary');

exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, couponCode, notes, transactionId } = req.body;

    // Parse JSON strings sent via FormData
    let items, shippingAddress, guestInfo;
    try {
      items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
      shippingAddress = typeof req.body.shippingAddress === 'string' ? JSON.parse(req.body.shippingAddress) : req.body.shippingAddress;
      guestInfo = req.body.guestInfo ? (typeof req.body.guestInfo === 'string' ? JSON.parse(req.body.guestInfo) : req.body.guestInfo) : null;
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Invalid order data format' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Get delivery charges
    let deliverySettings = await DeliverySettings.findOne();
    if (!deliverySettings) deliverySettings = { insideDhaka: 60, outsideDhaka: 120 };
    const deliveryCharge = shippingAddress.area === 'inside_dhaka' ? deliverySettings.insideDhaka : deliverySettings.outsideDhaka;
    
    // Calculate items
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      const price = product.discountedPrice || product.price;
      const total = price * item.quantity;
      subtotal += total;
      orderItems.push({
        product: product._id, name: product.name,
        image: product.images[0]?.url || '',
        price: product.price, discountedPrice: price,
        size: item.size, quantity: item.quantity, total
      });
    }
    
    // Apply coupon
    let discount = 0;
    let couponData = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.expiryDate > new Date() && coupon.usedCount < coupon.maxUses && subtotal >= coupon.minOrderAmount) {
        discount = coupon.discountType === 'percent' ? (subtotal * coupon.discountValue / 100) : coupon.discountValue;
        couponData = { code: coupon.code, discount };
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }
    
    const total = subtotal + deliveryCharge - discount;
    
    // Payment screenshot
    let paymentInfo = { status: paymentMethod === 'cod' ? 'approved' : 'pending' };
    if (transactionId) paymentInfo.transactionId = transactionId;
    if (req.file) {
      paymentInfo.screenshotUrl = req.file.path;
      paymentInfo.screenshotPublicId = req.file.filename;
    }
    
    const order = await Order.create({
      user: req.user?._id,
      guestInfo: req.user ? undefined : guestInfo,
      items: orderItems, shippingAddress, paymentMethod, paymentInfo,
      coupon: couponData, subtotal, deliveryCharge, discount, total, notes,
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });
    
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user && order.user && order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || `Status updated to ${status}` });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.paymentInfo.status = status;
    if (status === 'approved') order.paymentInfo.approvedAt = new Date();
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const [totalOrders, pendingOrders, deliveredOrders, totalRevenue, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.aggregate([{ $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email')
    ]);
    res.json({
      success: true,
      stats: {
        totalOrders, pendingOrders, deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
