const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, size, sort, page = 1, limit = 12, featured, flashSale, newArrival, trending } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { tags: { $in: [new RegExp(search, 'i')] } }];
    if (minPrice || maxPrice) query.discountedPrice = {};
    if (minPrice) query.discountedPrice.$gte = Number(minPrice);
    if (maxPrice) query.discountedPrice.$lte = Number(maxPrice);
    if (size) query['sizes.size'] = size;
    if (featured === 'true') query.isFeatured = true;
    if (flashSale === 'true') query.isFlashSale = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (trending === 'true') query.isTrending = true;
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { discountedPrice: 1 };
    if (sort === 'price_desc') sortObj = { discountedPrice: -1 };
    if (sort === 'rating') sortObj = { ratings: -1 };
    if (sort === 'popular') sortObj = { numReviews: -1 };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { slug: id }], isActive: true }
      : { slug: id, isActive: true };
    const product = await Product.findOne(query)
      .populate('category', 'name slug').populate('subcategory', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = req.body;
    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => ({ url: f.path, public_id: f.filename }));
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const data = req.body;
    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({ url: f.path, public_id: f.filename }));
      const existing = data.existingImages ? JSON.parse(data.existingImages) : [];
      data.images = [...existing, ...newImages];
    }
    // Recalc discounted price
    if (data.price && data.discountPercent !== undefined) {
      data.discountedPrice = data.price - (data.price * data.discountPercent / 100);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    // Delete images from cloudinary
    for (const img of product.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
