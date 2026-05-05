const express = require('express');
const LivePrice = require('../models/LivePrice');

function pricesRouter(state) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const prices = await LivePrice.find().sort({ crop: 1 }).lean();
    res.json(prices);
  });

  return router;
}

module.exports = { pricesRouter };
