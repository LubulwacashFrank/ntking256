const LivePrice = require('../models/LivePrice');

async function tickPrices(state) {
  const prices = await LivePrice.find().lean();
  const updates = prices.map(p => {
    const change = Math.floor(Math.random() * 20) - 10;
    const newPrice = Math.max(500, p.price + change);
    return {
      updateOne: {
        filter: { _id: p._id },
        update: { previousPrice: p.price, price: newPrice, change: Math.abs(change), trend: change >= 0 ? 'up' : 'down', lastUpdated: new Date() }
      }
    };
  });
  if (updates.length) await LivePrice.bulkWrite(updates);
  return LivePrice.find().lean();
}

function startPriceTicker(state, onTick) {
  setInterval(async () => {
    try {
      const updated = await tickPrices(state);
      if (typeof onTick === 'function') onTick(updated);
    } catch (e) {
      console.error('[priceTicker] error:', e.message);
    }
  }, 30000);
}

module.exports = { startPriceTicker };
