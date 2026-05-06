const express = require('express');
const LivePrice = require('../models/LivePrice');

function pricesRouter(state) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const prices = await LivePrice.find().sort({ crop: 1 }).lean();
    const formatted = prices.map(p => ({
      ...p,
      lastUpdated: p.lastUpdated ? new Date(p.lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Just now'
    }));
    res.json(formatted);
  });

  return router;
}

module.exports = { pricesRouter };
