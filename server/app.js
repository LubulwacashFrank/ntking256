const express = require("express");
const path = require("path");
const { bootstrapRouter } = require("./routes/bootstrap.routes");
const { productsRouter } = require("./routes/products.routes");
const { pricesRouter } = require("./routes/prices.routes");
const { weatherRouter } = require("./routes/weather.routes");
const { chatRouter } = require("./routes/chat.routes");
const { inquiriesRouter } = require("./routes/inquiries.routes");
const { feedbackRouter } = require("./routes/feedback.routes");
const { authRouter } = require("./routes/auth.routes");
const { adminRouter } = require("./routes/admin.routes");
const paymentsRouter = require("./routes/payments.routes");
const reviewsRouter = require("./routes/reviews.routes");
const ordersRouter = require("./routes/orders.routes");

function createApp(state) {
  const app = express();
  const clientDir = path.join(__dirname, "..", "client");

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.static(clientDir, { index: false }));

  app.use("/api/bootstrap", bootstrapRouter(state));
  app.use("/api/products", productsRouter(state));
  app.use("/api/live-prices", pricesRouter(state));
  app.use("/api/weather", weatherRouter(state));
  app.use("/api/chat", chatRouter(state));
  app.use("/api/feedback", feedbackRouter(state));
  app.use("/api/bulk-inquiries", inquiriesRouter(state));
  app.use("/api/auth", authRouter());
  app.use("/api/admin", adminRouter(state));
  app.use("/api/payments", paymentsRouter(state));
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/orders", ordersRouter(state));

  app.get("/", (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });

  app.get("/admin", (req, res) => {
    res.sendFile(path.join(clientDir, "admin.html"));
  });

  app.get("/auth", (req, res) => {
    res.sendFile(path.join(clientDir, "auth.html"));
  });

  app.get("/farmer", (req, res) => {
    res.sendFile(path.join(clientDir, "farmer.html"));
  });

  app.get("/buyer", (req, res) => {
    res.sendFile(path.join(clientDir, "buyer.html"));
  });

  return app;
}

module.exports = { createApp };
