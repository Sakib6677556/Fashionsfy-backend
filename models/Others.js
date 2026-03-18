const mongoose = require('mongoose');

// Review Model
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [String]
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Coupon Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Banner Model
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  imageUrl: String,
  imagePublicId: String,
  link: String,
  buttonText: String,
  position: { type: String, enum: ['hero', 'mid', 'bottom'], default: 'hero' },
  order: { type: Number, default: 0 },
  bgColor: { type: String, default: '#FF4B2B' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Delivery Settings Model
const deliverySchema = new mongoose.Schema({
  insideDhaka: { type: Number, default: 60 },
  outsideDhaka: { type: Number, default: 120 },
  freeDeliveryThreshold: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const DeliverySettings = mongoose.model('DeliverySettings', deliverySchema);

module.exports = { Review, Coupon, Banner, DeliverySettings };
