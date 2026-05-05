const express = require('express');
const Product = require('../models/Product');
const LivePrice = require('../models/LivePrice');
const Announcement = require('../models/Announcement');

const WEATHER_DATA = [
  { region: 'Central Region (Kampala)', temp: 26, condition: 'Partly Cloudy', humidity: 68, rain: 30, wind: 12, advisory: 'Good day for harvesting maize and beans. Light rain expected in afternoon.' },
  { region: 'Eastern Region (Jinja/Mbale)', temp: 24, condition: 'Light Rain', humidity: 78, rain: 65, wind: 15, advisory: 'Ideal for coffee drying indoors. Postpone outdoor activities until rain stops.' },
  { region: 'Western Region (Mbarara/Kabale)', temp: 28, condition: 'Sunny', humidity: 52, rain: 10, wind: 8, advisory: 'Perfect conditions for Irish potato planting. Ensure adequate irrigation.' },
  { region: 'Northern Region (Gulu/Lira)', temp: 30, condition: 'Mostly Sunny', humidity: 45, rain: 15, wind: 18, advisory: 'Excellent for sesame and sorghum harvesting. Store grains properly due to heat.' }
];

function bootstrapRouter(state) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const [products, livePrices, announcements] = await Promise.all([
        Product.find({ status: 'active' }).populate('farmerId', 'name email').lean(),
        LivePrice.find().sort({ crop: 1 }).lean(),
        Announcement.find({ active: true }).sort({ createdAt: -1 }).limit(10).lean()
      ]);

      res.json({
        products,
        livePrices,
        weatherData: WEATHER_DATA,
        announcements,
        chatMessages: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  return router;
}

module.exports = { bootstrapRouter };
