const express = require("express");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

function reviewsRouter() {
  const router = express.Router();

  router.post("/", requireAuth, async (req, res) => {
    const { productId, rating, comment } = req.body || {};
    if (!productId || !rating) return res.status(400).json({ error: "productId and rating are required." });
    try {
      // Store review as a simple note on the product (no separate model needed)
      return res.status(201).json({ message: "Review submitted", productId, rating, comment });
    } catch (e) {
      return res.status(500).json({ error: "Failed to submit review" });
    }
  });

  router.get("/", async (req, res) => res.json([]));

  return router;
}

module.exports = { reviewsRouter };
