const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestInfo: {
    name: String,
    phone: String,
    email: String
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    price: Number,
    discountedPrice: Number,
    size: String,
    quantity: { type: Number, required: true, min: 1 },
    total: Number
  }],
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    district: String,
    area: { type: String, enum: ['inside_dhaka', 'outside_dhaka'] }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'bkash', 'nagad', 'rocket'],
    required: true
  },
  paymentInfo: {
    transactionId: String,
    screenshotUrl: String,
    screenshotPublicId: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedAt: Date
  },
  coupon: {
    code: String,
    discount: Number
  },
  subtotal: Number,
  deliveryCharge: Number,
  discount: { type: Number, default: 0 },
  total: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  whatsappOrdered: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
