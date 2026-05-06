const express = require("express");
const Payment = require("../models/Payment");
const { BulkInquiry } = require("../models/BulkInquiry");
const Transaction = require("../models/Transaction");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

function paymentsRouter(state) {
  const router = express.Router();

  // Buyer submits payment proof for an inquiry
  router.post("/", requireAuth, async (req, res) => {
    const { inquiryId, amount, method, phone, reference } = req.body || {};
    if (!inquiryId || !amount || !method)
      return res.status(400).json({ error: "inquiryId, amount and method are required." });

    try {
      const inquiry = await BulkInquiry.findById(inquiryId);
      if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

      const payment = await Payment.create({
        inquiryId,
        buyerId: req.user.id,
        amount: Number(amount),
        method,
        phone: phone || "",
        reference: reference || `REF-${Date.now()}`,
        status: "pending"
      });

      await BulkInquiry.findByIdAndUpdate(inquiryId, {
        $set: { notes: `Payment: ${method} | Phone: ${phone || "-"} | Ref: ${payment.reference}` }
      });

      if (state.io) state.io.emit("notification", { type: "new_payment", payment });
      return res.status(201).json(payment);
    } catch (e) {
      return res.status(500).json({ error: "Failed to submit payment" });
    }
  });

  // Buyer views their own payments
  router.get("/", requireAuth, async (req, res) => {
    try {
      const payments = await Payment.find({ buyerId: req.user.id })
        .populate("inquiryId", "product quantity targetPrice status")
        .sort({ createdAt: -1 });
      return res.json(payments);
    } catch (e) {
      return res.status(500).json({ error: "Failed to load payments" });
    }
  });

  // Admin: list all payments
  router.get("/all", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate("buyerId", "name email")
        .populate("inquiryId", "product quantity targetPrice status")
        .sort({ createdAt: -1 });
      return res.json(payments);
    } catch (e) {
      return res.status(500).json({ error: "Failed to load payments" });
    }
  });

  // Admin: confirm payment → mark paid, complete inquiry, record transactions
  router.post("/:id/confirm", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id).populate("inquiryId");
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.status !== "pending")
        return res.status(400).json({ error: "Payment already processed" });

      payment.status = "paid";
      await payment.save();

      const inquiry = payment.inquiryId;
      if (inquiry) {
        const total = Number(inquiry.targetPrice || 0) * Number(inquiry.quantity || 0);
        const commission = Math.round(total * 0.05);
        await BulkInquiry.findByIdAndUpdate(inquiry._id, { $set: { status: "completed" } });
        await Transaction.insertMany([
          { type: "income", amount: commission, party: "Platform", category: "Commission",
            notes: `Commission from order ${String(inquiry._id).slice(-8)}`, status: "completed" },
          { type: "outgoing", amount: total - commission, party: String(inquiry.createdBy || "Seller"),
            category: "Payout", notes: `Payout for order ${String(inquiry._id).slice(-8)}`, status: "completed" }
        ]);
      }

      if (state.io) state.io.emit("notification", { type: "payment_confirmed", paymentId: payment._id });
      return res.json({ message: "Payment confirmed", payment });
    } catch (e) {
      return res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Admin: reject payment
  router.post("/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.status !== "pending")
        return res.status(400).json({ error: "Payment already processed" });

      payment.status = "failed";
      await payment.save();

      if (state.io) state.io.emit("notification", { type: "payment_rejected", paymentId: payment._id });
      return res.json({ message: "Payment rejected", payment });
    } catch (e) {
      return res.status(500).json({ error: "Failed to reject payment" });
    }
  });

  return router;
}

module.exports = { paymentsRouter };
