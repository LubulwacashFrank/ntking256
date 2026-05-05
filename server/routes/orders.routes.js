const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// orders router needs state for io — use a factory
function ordersRouter(state) {
  const { notify } = require('../services/notify');
  const router = express.Router();

  // POST /api/orders — place order (guest or logged-in buyer)
  router.post('/', async (req, res) => {
    const { productId, productName, quantity, pricePerUnit, method = 'mobile_money', phone, guestName = '', guestEmail = '', notes = '' } = req.body;
    if (!productId || !productName || !quantity || !pricePerUnit || !phone) {
      return res.status(400).json({ error: 'productId, productName, quantity, pricePerUnit and phone are required' });
    }

    let buyerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'secret');
        buyerId = payload.id || payload._id || null;
      } catch (_) {}
    }

    const ref = 'ORD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = await Order.create({
      productId, productName,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      totalAmount: Number(quantity) * Number(pricePerUnit),
      method, phone, guestName, guestEmail, buyerId, notes, reference: ref
    });

    // Notify admins in real time
    notify(state, {
      toAdmins: true,
      type: 'new_order',
      title: '🛒 New Order Placed',
      body: `${guestName || 'A buyer'} ordered ${quantity} ${productName}`,
      data: { orderId: String(order._id) }
    });

    return res.status(201).json({ order, message: 'Order placed! Awaiting confirmation.' });
  });

  // GET /api/orders — buyer sees own, admin sees all
  router.get('/', requireAuth, async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { buyerId: req.user.id };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(orders);
  });

  // POST /api/orders/:id/confirm — admin confirms
  router.post('/:id/confirm', requireAuth, requireRole('admin'), async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'confirmed' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId) {
      notify(state, {
        toUserId: String(order.buyerId),
        type: 'order_confirmed',
        title: '✅ Order Confirmed',
        body: `Your order for ${order.productName} has been confirmed!`,
        data: { orderId: String(order._id) }
      });
    }
    return res.json({ order, message: 'Order confirmed' });
  });

  // POST /api/orders/:id/reject — admin rejects
  router.post('/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId) {
      notify(state, {
        toUserId: String(order.buyerId),
        type: 'order_rejected',
        title: '❌ Order Rejected',
        body: `Your order for ${order.productName} was rejected. Contact support.`,
        data: { orderId: String(order._id) }
      });
    }
    return res.json({ order, message: 'Order rejected' });
  });

  return router;
}

module.exports = ordersRouter;
