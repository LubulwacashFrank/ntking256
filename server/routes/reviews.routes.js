const express = require('express');
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();

// GET /api/reviews?productId=  — public
router.get('/', async (req, res) => {
  const { productId } = req.query;
  const filter = productId ? { productId } : {};
  const reviews = await Review.find(filter)
    .populate('reviewerId', 'name')
    .sort({ createdAt: -1 }).lean();
  return res.json(reviews);
});

// POST /api/reviews — buyer submits review (one per product enforced by unique index)
router.post('/', requireAuth, requireRole('bulk_buyer'), async (req, res) => {
  const { productId, rating, comment = '' } = req.body;
  if (!productId || !rating) return res.status(400).json({ error: 'productId and rating are required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });

  try {
    const review = await Review.create({
      productId, reviewerId: req.user.id, rating: Number(rating), comment
    });
    const populated = await review.populate('reviewerId', 'name');
    return res.status(201).json(populated);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'You already reviewed this product' });
    throw e;
  }
});

// GET /api/reviews/all — admin only
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
  const reviews = await Review.find()
    .populate('reviewerId', 'name email')
    .populate('productId', 'name')
    .sort({ createdAt: -1 }).lean();
  return res.json(reviews);
});

// DELETE /api/reviews/:id — admin only
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  return res.json({ message: 'Review deleted' });
});

module.exports = router;
