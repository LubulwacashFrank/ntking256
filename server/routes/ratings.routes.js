const express = require('express');
const FarmerRating = require('../models/FarmerRating');
const Review = require('../models/Review');
const { User } = require('../models/User');
const { BulkInquiry } = require('../models/BulkInquiry');
const Product = require('../models/Product');

function ratingsRouter() {
  const router = express.Router();

  // ==================== FARMER RATINGS ====================
  
  // Submit farmer rating (buyers only)
  router.post('/farmer', async (req, res) => {
    const { farmerId, orderId, rating, comment, categories } = req.body;
    const buyerId = req.user?.id;

    if (!buyerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!farmerId || !rating) {
      return res.status(400).json({ error: 'farmerId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
      // Verify farmer exists
      const farmer = await User.findById(farmerId);
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      // Verify buyer
      const buyer = await User.findById(buyerId);
      if (!buyer || buyer.role !== 'bulk_buyer') {
        return res.status(403).json({ error: 'Only buyers can rate farmers' });
      }

      // Check if order exists and is completed
      let verified = false;
      if (orderId) {
        const order = await BulkInquiry.findById(orderId);
        if (order && order.status === 'completed' && String(order.createdBy) === String(buyerId)) {
          verified = true;
        }
      }

      // Create or update rating
      const farmerRating = await FarmerRating.findOneAndUpdate(
        { farmerId, buyerId, orderId: orderId || null },
        {
          rating,
          comment: comment || '',
          categories: categories || {},
          verified
        },
        { upsert: true, new: true, runValidators: true }
      );

      // Update farmer's average rating
      await updateFarmerAverageRating(farmerId);

      return res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        rating: farmerRating
      });

    } catch (error) {
      console.error('Farmer rating error:', error);
      return res.status(500).json({ error: 'Failed to submit rating' });
    }
  });

  // Get farmer ratings
  router.get('/farmer/:farmerId', async (req, res) => {
    try {
      const ratings = await FarmerRating.find({ farmerId: req.params.farmerId })
        .populate('buyerId', 'name organization')
        .sort({ createdAt: -1 })
        .lean();

      const stats = await FarmerRating.aggregate([
        { $match: { farmerId: new require('mongoose').Types.ObjectId(req.params.farmerId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            avgQuality: { $avg: '$categories.quality' },
            avgDelivery: { $avg: '$categories.delivery' },
            avgCommunication: { $avg: '$categories.communication' },
            avgValue: { $avg: '$categories.value' },
            fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      ]);

      return res.json({
        ratings,
        stats: stats[0] || {
          avgRating: 0,
          totalRatings: 0,
          avgQuality: 0,
          avgDelivery: 0,
          avgCommunication: 0,
          avgValue: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStar: 0
        }
      });

    } catch (error) {
      console.error('Get farmer ratings error:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  });

  // ==================== PRODUCT REVIEWS ====================

  // Submit product review
  router.post('/product', async (req, res) => {
    const { productId, rating, comment } = req.body;
    const reviewerId = req.user?.id;

    if (!reviewerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productId || !rating) {
      return res.status(400).json({ error: 'productId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Create or update review
      const review = await Review.findOneAndUpdate(
        { productId, reviewerId },
        { rating, comment: comment || '' },
        { upsert: true, new: true, runValidators: true }
      );

      // Update product average rating
      await updateProductAverageRating(productId);

      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review
      });

    } catch (error) {
      console.error('Product review error:', error);
      return res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  // Get product reviews
  router.get('/product/:productId', async (req, res) => {
    try {
      const reviews = await Review.find({ productId: req.params.productId })
        .populate('reviewerId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      const stats = await Review.aggregate([
        { $match: { productId: new require('mongoose').Types.ObjectId(req.params.productId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      return res.json({
        reviews,
        stats: stats[0] || { avgRating: 0, totalReviews: 0 }
      });

    } catch (error) {
      console.error('Get product reviews error:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // ==================== MY RATINGS ====================

  // Get my submitted ratings (buyer)
  router.get('/my-ratings', async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const farmerRatings = await FarmerRating.find({ buyerId: userId })
        .populate('farmerId', 'name district')
        .populate('orderId', 'product quantity')
        .sort({ createdAt: -1 })
        .lean();

      const productReviews = await Review.find({ reviewerId: userId })
        .populate('productId', 'name farmer')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        farmerRatings,
        productReviews
      });

    } catch (error) {
      console.error('Get my ratings error:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  });

  // Get ratings received (farmer)
  router.get('/received', async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const user = await User.findById(userId);
      if (!user || user.role !== 'farmer') {
        return res.status(403).json({ error: 'Only farmers can view received ratings' });
      }

      const ratings = await FarmerRating.find({ farmerId: userId })
        .populate('buyerId', 'name organization')
        .populate('orderId', 'product quantity')
        .sort({ createdAt: -1 })
        .lean();

      const stats = await FarmerRating.aggregate([
        { $match: { farmerId: new require('mongoose').Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      return res.json({
        ratings,
        stats: stats[0] || { avgRating: 0, totalRatings: 0 }
      });

    } catch (error) {
      console.error('Get received ratings error:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  // Get all ratings (admin)
  router.get('/all', async (req, res) => {
    try {
      const farmerRatings = await FarmerRating.find()
        .populate('farmerId', 'name email')
        .populate('buyerId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const productReviews = await Review.find()
        .populate('productId', 'name')
        .populate('reviewerId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        farmerRatings,
        productReviews
      });

    } catch (error) {
      console.error('Get all ratings error:', error);
      return res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  });

  // Delete farmer rating (admin)
  router.delete('/farmer/:id', async (req, res) => {
    try {
      const rating = await FarmerRating.findByIdAndDelete(req.params.id);
      if (!rating) {
        return res.status(404).json({ error: 'Rating not found' });
      }

      // Update farmer's average rating
      await updateFarmerAverageRating(rating.farmerId);

      return res.json({ success: true, message: 'Rating deleted' });

    } catch (error) {
      console.error('Delete farmer rating error:', error);
      return res.status(500).json({ error: 'Failed to delete rating' });
    }
  });

  // Delete product review (admin)
  router.delete('/product/:id', async (req, res) => {
    try {
      const review = await Review.findByIdAndDelete(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Update product average rating
      await updateProductAverageRating(review.productId);

      return res.json({ success: true, message: 'Review deleted' });

    } catch (error) {
      console.error('Delete product review error:', error);
      return res.status(500).json({ error: 'Failed to delete review' });
    }
  });

  return router;
}

// Helper function to update farmer's average rating
async function updateFarmerAverageRating(farmerId) {
  try {
    const stats = await FarmerRating.aggregate([
      { $match: { farmerId: new require('mongoose').Types.ObjectId(farmerId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
    ]);

    const avgRating = stats[0]?.avgRating || 0;
    const totalRatings = stats[0]?.totalRatings || 0;

    await User.findByIdAndUpdate(farmerId, {
      rating: Math.round(avgRating * 10) / 10,
      totalRatings
    });

  } catch (error) {
    console.error('Update farmer rating error:', error);
  }
}

// Helper function to update product's average rating
async function updateProductAverageRating(productId) {
  try {
    const stats = await Review.aggregate([
      { $match: { productId: new require('mongoose').Types.ObjectId(productId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const avgRating = stats[0]?.avgRating || 0;
    const totalReviews = stats[0]?.totalReviews || 0;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews
    });

  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

module.exports = { ratingsRouter };
