const Category = require('../models/Category');
const User = require('../models/User');
const { Review, Coupon, Banner, DeliverySettings } = require('../models/Others');
const Product = require('../models/Product');

// --- CATEGORY ---
exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).populate('parent', 'name slug').sort({ order: 1, name: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCategory = async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- WISHLIST ---
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(req.params.productId);
    let action;
    if (idx > -1) { user.wishlist.splice(idx, 1); action = 'removed'; }
    else { user.wishlist.push(req.params.productId); action = 'added'; }
    await user.save();
    res.json({ success: true, action, wishlist: user.wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- REVIEWS ---
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    const review = await Review.create({ product: req.params.productId, user: req.user._id, rating, comment });
    // Update product rating
    const reviews = await Review.find({ product: req.params.productId });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.productId, { ratings: avgRating, numReviews: reviews.length });
    res.status(201).json({ success: true, review });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- COUPONS ---
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiryDate < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon limit reached' });
    if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ success: false, message: `Minimum order ৳${coupon.minOrderAmount} required` });
    const discount = coupon.discountType === 'percent' ? (orderAmount * coupon.discountValue / 100) : coupon.discountValue;
    res.json({ success: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- BANNERS ---
exports.getBanners = async (req, res) => {
  try {
    const query = req.user?.role === 'admin' ? {} : { isActive: true };
    const banners = await Banner.find(query).sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createBanner = async (req, res) => {
  try {
    if (req.file) { req.body.imageUrl = req.file.path; req.body.imagePublicId = req.file.filename; }
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, banner });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateBanner = async (req, res) => {
  try {
    if (req.file) { req.body.imageUrl = req.file.path; req.body.imagePublicId = req.file.filename; }
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, banner });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- DELIVERY SETTINGS ---
exports.getDeliverySettings = async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne();
    if (!settings) settings = { insideDhaka: 60, outsideDhaka: 120 };
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateDeliverySettings = async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne();
    if (settings) {
      settings = await DeliverySettings.findByIdAndUpdate(settings._id, { ...req.body, updatedBy: req.user._id }, { new: true });
    } else {
      settings = await DeliverySettings.create({ ...req.body, updatedBy: req.user._id });
    }
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- ADMIN USERS ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
