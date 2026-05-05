const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  district: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  stock: { type: String, required: true },
  description: { type: String, default: '' },
  farmer: { type: String, required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  fresh: { type: Boolean, default: true },
  image: { type: String },
  badges: [{ type: String }],
  status: { type: String, default: 'active' },
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);