const express = require('express');
const router = express.Router();
const { getDeliverySettings, updateDeliverySettings } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/auth');
router.get('/', getDeliverySettings);
router.put('/', protect, adminOnly, updateDeliverySettings);
module.exports = router;
