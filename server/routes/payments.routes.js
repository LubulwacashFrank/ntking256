const express = require('express');
const Payment = require('../models/Payment');
const { BulkInquiry } = require('../models/BulkInquiry');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

function paymentsRouter(state) {
  const { notify } = require('../services/notify');
  const router = express.Router();

  // POST /api/payments — buyer initiates payment
  router.post('/', requireAuth, requireRole('bulk_buyer'), async (req, res) => {
    const { inquiryId, amount, method = 'mobile_money', phone = '' } = req.body;
    if (!inquiryId || !amount) return res.status(400).json({ error: 'inquiryId and amount are required' });

    const inquiry = await BulkInquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    if (String(inquiry.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: 'Not your inquiry' });

    const ref = 'PAY-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const payment = await Payment.create({
      inquiryId, buyerId: req.user.id, amount: Number(amount), method, phone, reference: ref
    });

    await BulkInquiry.findByIdAndUpdate(inquiryId, { status: 'processing' });

    notify(state, {
      toAdmins: true,
      type: 'new_payment',
      title: '💳 Payment Initiated',
      body: `Buyer submitted UGX ${Number(amount).toLocaleString()} payment for ${inquiry.product}`,
      data: { paymentId: String(payment._id) }
    });

    return res.status(201).json({ payment, message: 'Payment initiated. Awaiting confirmation.' });
  });

  // GET /api/payments
  router.get('/', requireAuth, async (req, res) => {
    const filter = req.user.role === 'bulk_buyer' ? { buyerId: req.user.id } : {};
    const payments = await Payment.find(filter)
      .populate('inquiryId', 'product quantity location status')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 }).lean();
    return res.json(payments);
  });

  // POST /api/payments/:id/confirm
  router.post('/:id/confirm', requireAuth, requireRole('admin'), async (req, res) => {
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await BulkInquiry.findByIdAndUpdate(payment.inquiryId, { status: 'completed' });
    notify(state, {
      toUserId: String(payment.buyerId),
      type: 'payment_confirmed',
      title: '✅ Payment Confirmed',
      body: `Your payment of UGX ${Number(payment.amount).toLocaleString()} has been confirmed!`,
      data: { paymentId: String(payment._id) }
    });
    return res.json({ payment, message: 'Payment confirmed' });
  });

  // POST /api/payments/:id/reject
  router.post('/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'failed' }, { new: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await BulkInquiry.findByIdAndUpdate(payment.inquiryId, { status: 'pending' });
    notify(state, {
      toUserId: String(payment.buyerId),
      type: 'payment_rejected',
      title: '❌ Payment Rejected',
      body: `Your payment was rejected. Please try again or contact support.`,
      data: { paymentId: String(payment._id) }
    });
    return res.json({ payment, message: 'Payment rejected' });
  });

  return router;
}

module.exports = paymentsRouter;
