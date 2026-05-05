const express = require("express");
const { BulkInquiry } = require("../models/BulkInquiry");
const { requireAuth } = require("../middleware/auth");

function paymentsRouter(state) {
  const router = express.Router();

  // Initiate payment — updates the inquiry with payment info
  router.post("/", requireAuth, async (req, res) => {
    const { inquiryId, amount, method, phone } = req.body || {};
    if (!inquiryId || !amount || !method || !phone) {
      return res.status(400).json({ error: "inquiryId, amount, method and phone are required." });
    }
    try {
      const inquiry = await BulkInquiry.findByIdAndUpdate(
        inquiryId,
        { $set: { status: "processing", notes: `Payment: ${method} | Phone: ${phone} | Amount: UGX ${amount}` } },
        { new: true }
      );
      if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
      return res.json({ message: "Payment initiated", inquiry });
    } catch (e) {
      return res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  router.get("/", requireAuth, async (req, res) => {
    try {
      const inquiries = await BulkInquiry.find({ createdBy: req.user.id, status: { $in: ["processing", "completed"] } }).sort({ createdAt: -1 });
      return res.json(inquiries);
    } catch (e) {
      return res.status(500).json({ error: "Failed to load payments" });
    }
  });

  return router;
}

module.exports = { paymentsRouter };
