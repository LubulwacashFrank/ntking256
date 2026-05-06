const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "farmer", "bulk_buyer"], required: true },
    district: { type: String, default: "" },
    organization: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    payoutPhone: { type: String, default: "" },
    payoutAccount: { type: String, default: "" },
    payoutBank: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
