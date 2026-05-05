const express = require('express');

const WEATHER_DATA = [
  { region: 'Central Region (Kampala)', temp: 26, condition: 'Partly Cloudy', humidity: 68, rain: 30, wind: 12, advisory: 'Good day for harvesting maize and beans. Light rain expected in afternoon.' },
  { region: 'Eastern Region (Jinja/Mbale)', temp: 24, condition: 'Light Rain', humidity: 78, rain: 65, wind: 15, advisory: 'Ideal for coffee drying indoors. Postpone outdoor activities until rain stops.' },
  { region: 'Western Region (Mbarara/Kabale)', temp: 28, condition: 'Sunny', humidity: 52, rain: 10, wind: 8, advisory: 'Perfect conditions for Irish potato planting. Ensure adequate irrigation.' },
  { region: 'Northern Region (Gulu/Lira)', temp: 30, condition: 'Mostly Sunny', humidity: 45, rain: 15, wind: 18, advisory: 'Excellent for sesame and sorghum harvesting. Store grains properly due to heat.' }
];

function weatherRouter(state) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(WEATHER_DATA);
  });

  return router;
}

module.exports = { weatherRouter };
