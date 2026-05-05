const express = require('express');
const { User } = require('../models/User');
const { BulkInquiry } = require('../models/BulkInquiry');
const Product = require('../models/Product');
const LivePrice = require('../models/LivePrice');
const Transaction = require('../models/Transaction');
const Announcement = require('../models/Announcement');

function adminRouter(state) {
  const router = express.Router();

  // ── USERS ──────────────────────────────────────────────
  router.get('/users', async (req, res) => {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.json(users);
  });

  router.put('/users/:id', async (req, res) => {
    const { name, email, role, district, organization, isVerified } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).toLowerCase().trim();
    if (role !== undefined) updates.role = role;
    if (district !== undefined) updates.district = String(district).trim();
    if (organization !== undefined) updates.organization = String(organization).trim();
    if (isVerified !== undefined) updates.isVerified = Boolean(isVerified);
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' });
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { returnDocument: 'after', runValidators: true }).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    } catch (e) {
      return res.status(e.code === 11000 ? 409 : 500).json({ error: e.code === 11000 ? 'Email already in use' : e.message });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  });

  // ── PRODUCTS ───────────────────────────────────────────
  router.get('/products', async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json(products);
  });

  router.post('/products', async (req, res) => {
    const { name, category, price, unit, farmer, district, stock, status, verified, featured, fresh } = req.body || {};
    if (!name || !category || !price || !farmer || !district)
      return res.status(400).json({ error: 'name, category, price, farmer and district are required' });
    try {
      const product = await Product.create({
        name: String(name).trim(), category: String(category).trim(),
        price: Number(price), unit: unit ? String(unit).trim() : 'kg',
        farmer: String(farmer).trim(),
        farmerId: req.body.farmerId || new (require('mongoose').Types.ObjectId)(),
        district: String(district).trim(), stock: stock ? String(stock).trim() : 'N/A',
        status: status || 'active', verified: Boolean(verified),
        featured: Boolean(featured), fresh: Boolean(fresh)
      });
      return res.status(201).json(product);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create product' });
    }
  });

  router.put('/products/:id', async (req, res) => {
    const fields = ['name','category','price','unit','farmer','district','stock','status','verified','featured','fresh'];
    const updates = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates[f] = ['price'].includes(f) ? Number(req.body[f])
          : ['verified','featured','fresh'].includes(f) ? Boolean(req.body[f])
          : String(req.body[f]).trim();
      }
    }
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { returnDocument: 'after' });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.json(product);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update product' });
    }
  });

  router.delete('/products/:id', async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.json({ message: 'Product deleted' });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // ── INQUIRIES ──────────────────────────────────────────
  router.get('/inquiries', async (req, res) => {
    const inquiries = await BulkInquiry.find()
      .populate('createdBy', 'name email district organization payoutPhone payoutAccount payoutBank')
      .sort({ createdAt: -1 }).lean();
    return res.json(inquiries);
  });

  router.put('/inquiries/:id', async (req, res) => {
    const { status } = req.body || {};
    if (!status || !['pending','processing','completed','cancelled'].includes(status))
      return res.status(400).json({ error: 'Valid status required: pending, processing, completed, cancelled' });

    const inquiry = await BulkInquiry.findByIdAndUpdate(req.params.id, { $set: { status } }, { returnDocument: 'after' });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    if (status === 'completed') {
      const amount = Number(inquiry.targetPrice || 0) * Number(inquiry.quantity || 0);
      const commission = Math.round(amount * 0.05);
      await Transaction.insertMany([
        { type: 'income', amount: commission, party: 'Platform', category: 'Commission', notes: `Commission from order ${String(inquiry._id).slice(-8)}`, status: 'completed' },
        { type: 'outgoing', amount: amount - commission, party: String(inquiry.createdBy || 'Seller'), category: 'Payout', notes: `Payout for order ${String(inquiry._id).slice(-8)}`, status: 'completed' }
      ]);
    }
    return res.json(inquiry);
  });

  // ── PRICES ─────────────────────────────────────────────
  router.get('/prices', async (req, res) => {
    const prices = await LivePrice.find().sort({ crop: 1 }).lean();
    return res.json(prices);
  });

  router.put('/prices/:crop', async (req, res) => {
    const { price } = req.body || {};
    if (!price || price <= 0) return res.status(400).json({ error: 'Valid price required' });

    const existing = await LivePrice.findOne({ crop: { $regex: new RegExp(`^${req.params.crop}$`, 'i') } });
    if (!existing) return res.status(404).json({ error: 'Crop not found' });

    const updated = await LivePrice.findByIdAndUpdate(existing._id, {
      previousPrice: existing.price,
      price: Number(price),
      trend: Number(price) > existing.price ? 'up' : 'down',
      change: Math.abs(((Number(price) - existing.price) / existing.price) * 100).toFixed(1),
      lastUpdated: new Date()
    }, { returnDocument: 'after' });

    if (state.io) state.io.emit('prices:update', await LivePrice.find().lean());
    return res.json(updated);
  });

  // ── STATS ──────────────────────────────────────────────
  router.get('/stats', async (req, res) => {
    const [farmers, bulkBuyers, admins, totalProducts, totalInquiries, incomeAgg, outgoingAgg] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'bulk_buyer' }),
      User.countDocuments({ role: 'admin' }),
      Product.countDocuments({}),
      BulkInquiry.countDocuments({}),
      Transaction.aggregate([{ $match: { type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'outgoing' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;
    const totalOutgoing = outgoingAgg[0]?.total || 0;
    return res.json({ farmers, bulkBuyers, admins, totalProducts, totalInquiries, totalIncome, totalOutgoing, netFlow: totalIncome - totalOutgoing });
  });

  // ── TRANSACTIONS ───────────────────────────────────────
  router.get('/transactions', async (req, res) => {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).lean();
    return res.json(transactions);
  });

  router.post('/transactions', async (req, res) => {
    const { type, amount, party, category, notes } = req.body || {};
    if (!type || !['income','outgoing'].includes(type)) return res.status(400).json({ error: 'type must be income or outgoing' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'amount must be greater than zero' });
    const t = await Transaction.create({ type, amount: Number(amount), party: party || 'Unknown', category: category || 'General', notes: notes || '' });
    return res.status(201).json(t);
  });

  router.put('/transactions/:id', async (req, res) => {
    const { type, amount, party, category, notes, status } = req.body || {};
    const updates = {};
    if (type && ['income','outgoing'].includes(type)) updates.type = type;
    if (amount && Number(amount) > 0) updates.amount = Number(amount);
    if (party) updates.party = String(party).trim();
    if (category) updates.category = String(category).trim();
    if (notes !== undefined) updates.notes = String(notes).trim();
    if (status) updates.status = String(status).trim();
    const t = await Transaction.findByIdAndUpdate(req.params.id, { $set: updates }, { returnDocument: 'after' });
    if (!t) return res.status(404).json({ error: 'Transaction not found' });
    return res.json(t);
  });

  // ── ANNOUNCEMENTS ──────────────────────────────────────
  router.get('/broadcast', async (req, res) => {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(10).lean();
    return res.json(announcements);
  });

  router.post('/broadcast', async (req, res) => {
    const { message, type = 'info' } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });
    const a = await Announcement.create({ message: String(message).trim(), type: ['info','warning','success','error'].includes(type) ? type : 'info' });
    if (state.io) state.io.emit('announcement', a);
    return res.status(201).json(a);
  });

  router.delete('/broadcast/:id', async (req, res) => {
    const a = await Announcement.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    return res.json({ message: 'Deleted' });
  });

  return router;
}

module.exports = { adminRouter };
