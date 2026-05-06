const mongoose = require('mongoose');

const farmerRatingSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'BulkInquiry' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true },
  categories: {
    quality: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  helpful: { type: Number, default: 0 },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

farmerRatingSchema.index({ farmerId: 1, buyerId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('FarmerRating', farmerRatingSchema);
