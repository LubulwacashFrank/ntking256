const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const Product = require("../models/Product");

function productsRouter(state) {
  const router = express.Router();

  // ==================== PRODUCTS CRUD ====================
  router.get("/", async (req, res) => {
    try {
      const products = await Product.find().populate('farmerId', 'name email');
      return res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Farmer-specific routes — must be before /:id
  router.get("/farmer/my-products", requireAuth, requireRole("farmer"), async (req, res) => {
    try {
      const farmerProducts = await Product.find({ farmerId: req.user.id });
      return res.json(farmerProducts);
    } catch (error) {
      console.error('Error fetching farmer products:', error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('farmerId', 'name email');
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  router.post("/", requireAuth, requireRole("farmer"), async (req, res) => {
    try {
      const { name, category, price, unit, district, stock, status, description, image } = req.body || {};

      if (!name || !category || !price || !district) {
        return res.status(400).json({ error: "Name, category, price, and district are required." });
      }

      const newProduct = new Product({
        name: String(name).trim(),
        category: String(category).trim(),
        price: Number(price),
        unit: unit ? String(unit).trim() : "kg",
        farmer: req.user.name,
        farmerId: req.user.id,
        district: String(district).trim(),
        stock: stock ? String(stock).trim() : "N/A",
        status: status ? String(status).trim() : "active",
        description: description ? String(description).trim() : "",
        image: image || null,
        verified: false,
        featured: false,
        fresh: true
      });

      const savedProduct = await newProduct.save();
      return res.status(201).json(savedProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  });

  router.put("/:id", requireAuth, requireRole("farmer"), async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Check ownership
      if (product.farmerId.toString() !== req.user.id) {
        return res.status(403).json({ error: "You can only edit your own products" });
      }

      const { name, category, price, unit, district, stock, status, description, image } = req.body || {};

      if (name) product.name = String(name).trim();
      if (category) product.category = String(category).trim();
      if (price) product.price = Number(price);
      if (unit) product.unit = String(unit).trim();
      if (district) product.district = String(district).trim();
      if (stock) product.stock = String(stock).trim();
      if (status) product.status = String(status).trim();
      if (description !== undefined) product.description = String(description).trim();
      if (image !== undefined) product.image = image;
      product.updatedAt = new Date();

      const updatedProduct = await product.save();
      return res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  });

  router.delete("/:id", requireAuth, requireRole("farmer"), async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Check ownership
      if (product.farmerId.toString() !== req.user.id) {
        return res.status(403).json({ error: "You can only delete your own products" });
      }

      await Product.findByIdAndDelete(req.params.id);
      return res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  });

  return router;
}

module.exports = { productsRouter };
