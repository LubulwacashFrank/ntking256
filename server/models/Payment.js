const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BulkInquiry', required: true },
  buyerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:    { type: Number, required: true },
  method:    { type: String, enum: ['mobile_money', 'bank'], default: 'mobile_money' },
  phone:     { type: String, default: '' },
  status:    { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  reference: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
