'use strict';

// ─── Step 1: Load .env for LOCAL development only ─────────────
// On Render/Railway: env vars come from the dashboard, NOT a .env file
require('dotenv').config();

// ─── Step 2: Immediately print all env var status (helps debug) ──
console.log('=== Environment Check ===');
console.log('NODE_ENV     :', process.env.NODE_ENV || '(not set)');
console.log('PORT         :', process.env.PORT || '(not set - will use 5000)');
console.log('MONGODB_URI  :', process.env.MONGODB_URI
  ? '✅ SET (value hidden)'
  : '❌ NOT SET - this will crash!');
console.log('JWT_SECRET   :', process.env.JWT_SECRET
  ? '✅ SET'
  : '❌ NOT SET - auth will fail!');
console.log('FRONTEND_URL :', process.env.FRONTEND_URL || '(not set - CORS will allow all)');
console.log('CLOUDINARY   :', process.env.CLOUDINARY_CLOUD_NAME
  ? '✅ SET'
  : '⚠️  NOT SET - image uploads disabled');
console.log('=========================');

// ─── Step 3: Hard fail with clear message if critical vars missing ──
if (!process.env.MONGODB_URI) {
  console.error('');
  console.error('❌ FATAL: MONGODB_URI is not set.');
  console.error('');
  console.error('To fix this on Render:');
  console.error('  1. Open your Render service dashboard');
  console.error('  2. Click "Environment" in the left sidebar');
  console.error('  3. Click "Add Environment Variable"');
  console.error('  4. Key:   MONGODB_URI');
  console.error('  5. Value: mongodb+srv://USER:PASS@cluster.mongodb.net/fashionsfy?retryWrites=true&w=majority');
  console.error('  6. Click "Save Changes" — Render will auto-redeploy');
  console.error('');
  console.error('Common mistakes:');
  console.error('  - Wrong key name (must be exactly MONGODB_URI, all caps)');
  console.error('  - Variable set as Build variable instead of Runtime variable');
  console.error('  - Forgot to click Save Changes');
  console.error('  - Service not redeployed after adding variable');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set. Add it in Render Environment.');
  process.exit(1);
}

// ─── Step 4: Load Express and all modules ─────────────────────
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');

const app = express();

// ─── CORS ──────────────────────────────────────────────────────
// If FRONTEND_URL is set, only allow that origin. Otherwise allow all (dev mode).
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL : '*',
  credentials: true,
}));

// ─── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/products',   require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders',     require('./routes/orderRoutes'));
app.use('/api/cart',       require('./routes/cartRoutes'));
app.use('/api/wishlist',   require('./routes/wishlistRoutes'));
app.use('/api/reviews',    require('./routes/reviewRoutes'));
app.use('/api/coupons',    require('./routes/couponRoutes'));
app.use('/api/banners',    require('./routes/bannerRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/delivery',   require('./routes/deliveryRoutes'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Fashionsfy API',
    env: process.env.NODE_ENV || 'development',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Connect MongoDB then start server ────────────────────────
const PORT = process.env.PORT || 5000;

console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Fashionsfy server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Check your MONGODB_URI value:');
    console.error('  - Make sure the cluster is running in MongoDB Atlas');
    console.error('  - Make sure 0.0.0.0/0 is in your Atlas IP Access List');
    console.error('  - Make sure your DB user has readWrite permissions');
    process.exit(1);
  });

module.exports = app;
