const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId:   { type: String, required: true },
  productName: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  pricePerUnit:{ type: Number, required: true },
  totalAmount: { type: Number, required: true },
  method:      { type: String, enum: ['mobile_money', 'bank'], default: 'mobile_money' },
  phone:       { type: String, required: true },
  // For guest orders
  guestName:   { type: String, default: '' },
  guestEmail:  { type: String, default: '' },
  // For logged-in buyers
  buyerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:      { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  reference:   { type: String, default: '' },
  notes:       { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
