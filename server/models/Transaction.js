const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'outgoing'], required: true },
  amount: { type: Number, required: true },
  party: { type: String, default: 'Unknown' },
  category: { type: String, default: 'General' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
