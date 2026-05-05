const mongoose = require("mongoose");

const bulkInquirySchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    targetPrice: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "processing", "completed", "cancelled"], default: "pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

const BulkInquiry = mongoose.model("BulkInquiry", bulkInquirySchema);

module.exports = { BulkInquiry };
