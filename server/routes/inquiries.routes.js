const express = require("express");
const { BulkInquiry } = require("../models/BulkInquiry");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../services/notify");

function inquiriesRouter(state) {
  const router = express.Router();

  // GET all inquiries (farmers see all, buyers see their own)
  router.get("/", requireAuth, async (req, res) => {
    try {
      const filter = req.user.role === 'bulk_buyer' ? { createdBy: req.user.id } : {};
      const inquiries = await BulkInquiry.find(filter)
        .populate('createdBy', 'name email district organization')
        .sort({ createdAt: -1 })
        .lean();
      return res.json(inquiries);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
  });

  router.post("/", async (req, res) => {
     const { product, quantity, targetPrice, location, notes = "" } = req.body || {};

     if (!product || !quantity || !targetPrice || !location) {
       return res
         .status(400)
         .json({ error: "product, quantity, targetPrice and location are required." });
     }

     const inquiryPayload = {
       product: String(product).trim(),
       quantity: Number(quantity),
       targetPrice: Number(targetPrice),
       location: String(location).trim(),
       notes: String(notes).trim(),
       status: "pending"
     };

     const inquiry = await BulkInquiry.create({
       ...inquiryPayload,
       createdBy: req.user?.id || null
     });

     notify(state, {
       toAdmins: true,
       type: 'new_inquiry',
       title: '📋 New Bulk Inquiry',
       body: `${req.user?.name || 'A buyer'} wants ${inquiryPayload.quantity}kg of ${inquiryPayload.product}`,
       data: { inquiryId: String(inquiry._id) }
     });

     return res.status(201).json(inquiry);
   });

  return router;
}

module.exports = { inquiriesRouter };
