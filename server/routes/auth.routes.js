const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const Subscription = require("../models/Subscription");

function signAccessToken(user) {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRouter() {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { name, email, password, role, district = "", organization = "", payoutPhone = "", payoutAccount = "", payoutBank = "", subscriptionPlan, paymentReference } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password and role are required." });
    }

    if (!["farmer", "bulk_buyer"].includes(role)) {
      return res.status(400).json({ error: "role must be either farmer or bulk_buyer." });
    }

    // Farmers must select subscription plan
    if (role === 'farmer' && !subscriptionPlan) {
      return res.status(400).json({ error: "Subscription plan is required for farmers." });
    }

    if (role === 'farmer' && !['monthly', 'yearly'].includes(subscriptionPlan)) {
      return res.status(400).json({ error: "Invalid subscription plan. Choose monthly or yearly." });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (existing) {
      return res.status(409).json({ error: "Email is already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isVerified = role === 'bulk_buyer';
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role,
      district: String(district).trim(),
      organization: String(organization).trim(),
      payoutPhone: String(payoutPhone).trim(),
      payoutAccount: String(payoutAccount).trim(),
      payoutBank: String(payoutBank).trim(),
      isVerified
    });

    // Create subscription for farmers
    if (role === 'farmer') {
      const monthlyFee = 50000;
      const yearlyFee = Math.round((monthlyFee * 12) / 3); // One third of yearly total
      const amount = subscriptionPlan === 'monthly' ? monthlyFee : yearlyFee;
      const startDate = new Date();
      const endDate = new Date();
      if (subscriptionPlan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await Subscription.create({
        userId: user._id,
        plan: subscriptionPlan,
        amount,
        startDate,
        endDate,
        status: 'active',
        paymentReference: paymentReference || 'PENDING'
      });

      return res.status(201).json({
        pending: true,
        message: `Registration successful! Subscription: ${subscriptionPlan} (UGX ${amount.toLocaleString()}). Your account is pending admin approval after payment verification.`,
        subscription: { plan: subscriptionPlan, amount, endDate }
      });
    }

    const token = signAccessToken(user);
    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        organization: user.organization
      }
    });
  });

  router.post("/admin-login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    const token = signAccessToken(user);
    return res.json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: true
      }
    });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.role === 'farmer' && !user.isVerified) {
      return res.status(403).json({ error: "Your account is pending admin approval. Please wait for verification before logging in." });
    }

    const token = signAccessToken(user);
    return res.json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        organization: user.organization
      }
    });
  });

  return router;
}

module.exports = { authRouter };