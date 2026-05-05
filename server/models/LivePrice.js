const mongoose = require('mongoose');

const livePriceSchema = new mongoose.Schema({
  crop: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  previousPrice: { type: Number, default: 0 },
  trend: { type: String, default: 'up' },
  change: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LivePrice', livePriceSchema);
