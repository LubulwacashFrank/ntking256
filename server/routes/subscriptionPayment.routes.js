const express = require('express');
const { 
  initiateMobileMoneyPayment, 
  verifyPayment, 
  getSupportedNetworks,
  detectNetwork,
  formatPhoneNumber 
} = require('../services/paymentService');
const Subscription = require('../models/Subscription');
const { User } = require('../models/User');

function subscriptionPaymentRouter() {
  const router = express.Router();

  // Get supported mobile networks
  router.get('/networks', (req, res) => {
    res.json({ networks: getSupportedNetworks() });
  });

  // Initiate subscription payment
  router.post('/subscription/initiate', async (req, res) => {
    const { userId, phone, email, fullname, subscriptionPlan } = req.body;

    if (!userId || !phone || !email || !fullname || !subscriptionPlan) {
      return res.status(400).json({ 
        error: 'userId, phone, email, fullname, and subscriptionPlan are required' 
      });
    }

    if (!['monthly', 'yearly'].includes(subscriptionPlan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    try {
      // Calculate amount
      const monthlyFee = 50000;
      const yearlyFee = Math.round((monthlyFee * 12) / 3);
      const amount = subscriptionPlan === 'monthly' ? monthlyFee : yearlyFee;

      // Format phone and detect network
      const formattedPhone = formatPhoneNumber(phone);
      const network = detectNetwork(formattedPhone);

      // Generate unique transaction reference
      const txRef = `SUB-${userId}-${Date.now()}`;

      // Initiate payment
      const paymentResult = await initiateMobileMoneyPayment({
        amount,
        phone: formattedPhone,
        email,
        network,
        txRef,
        fullname,
        userId
      });

      if (!paymentResult.success) {
        return res.status(500).json({ 
          error: paymentResult.error || 'Payment initiation failed' 
        });
      }

      // Create pending subscription record
      const startDate = new Date();
      const endDate = new Date();
      if (subscriptionPlan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await Subscription.create({
        userId,
        plan: subscriptionPlan,
        amount,
        startDate,
        endDate,
        status: 'pending',
        paymentReference: txRef,
        paymentProvider: 'flutterwave',
        paymentNetwork: network
      });

      return res.json({
        success: true,
        message: `Payment request sent to ${formattedPhone} via ${network}. Please check your phone to complete the payment.`,
        txRef,
        amount,
        network,
        phone: formattedPhone,
        data: paymentResult.data
      });

    } catch (error) {
      console.error('Subscription payment error:', error);
      return res.status(500).json({ 
        error: 'Failed to initiate payment. Please try again.' 
      });
    }
  });

  // Verify subscription payment
  router.post('/subscription/verify', async (req, res) => {
    const { txRef, transactionId } = req.body;

    if (!txRef && !transactionId) {
      return res.status(400).json({ 
        error: 'txRef or transactionId is required' 
      });
    }

    try {
      // Find subscription by reference
      const subscription = await Subscription.findOne({ 
        paymentReference: txRef 
      }).populate('userId');

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Verify payment with Flutterwave
      const verificationResult = await verifyPayment(transactionId);

      if (!verificationResult.success) {
        return res.status(500).json({ 
          error: verificationResult.error || 'Verification failed' 
        });
      }

      if (verificationResult.verified) {
        // Update subscription status
        subscription.status = 'active';
        subscription.paymentVerifiedAt = new Date();
        await subscription.save();

        // Update user verification status
        await User.findByIdAndUpdate(subscription.userId._id, {
          isVerified: true
        });

        return res.json({
          success: true,
          verified: true,
          message: 'Payment verified successfully! Your subscription is now active.',
          subscription: {
            plan: subscription.plan,
            amount: subscription.amount,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status
          }
        });
      } else {
        return res.json({
          success: true,
          verified: false,
          message: 'Payment verification pending. Please try again in a moment.',
          data: verificationResult.data
        });
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      return res.status(500).json({ 
        error: 'Failed to verify payment. Please try again.' 
      });
    }
  });

  // Payment callback (webhook from Flutterwave)
  router.post('/callback', async (req, res) => {
    const { status, tx_ref, transaction_id } = req.body;

    try {
      if (status === 'successful') {
        // Verify the payment
        const verificationResult = await verifyPayment(transaction_id);

        if (verificationResult.verified) {
          // Find and update subscription
          const subscription = await Subscription.findOne({ 
            paymentReference: tx_ref 
          });

          if (subscription) {
            subscription.status = 'active';
            subscription.paymentVerifiedAt = new Date();
            await subscription.save();

            // Update user verification
            await User.findByIdAndUpdate(subscription.userId, {
              isVerified: true
            });
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Payment callback error:', error);
      res.status(500).json({ error: 'Callback processing failed' });
    }
  });

  // Check subscription status
  router.get('/subscription/status/:userId', async (req, res) => {
    try {
      const subscription = await Subscription.findOne({ 
        userId: req.params.userId 
      }).sort({ createdAt: -1 });

      if (!subscription) {
        return res.json({ 
          hasSubscription: false,
          message: 'No subscription found' 
        });
      }

      return res.json({
        hasSubscription: true,
        subscription: {
          plan: subscription.plan,
          amount: subscription.amount,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.status === 'active' && new Date() < subscription.endDate
        }
      });

    } catch (error) {
      console.error('Subscription status error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  });

  return router;
}

module.exports = { subscriptionPaymentRouter };
