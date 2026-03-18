const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountedPrice: { type: Number },
  images: [{ url: String, public_id: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sizes: [{
    size: String,
    stock: { type: Number, default: 0 }
  }],
  totalStock: { type: Number, default: 0 },
  brand: String,
  tags: [String],
  isFeatured: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }
  if (this.isModified('price') || this.isModified('discountPercent')) {
    this.discountedPrice = this.price - (this.price * this.discountPercent / 100);
  }
  if (this.sizes && this.sizes.length > 0) {
    this.totalStock = this.sizes.reduce((sum, s) => sum + s.stock, 0);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
