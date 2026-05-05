const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const LivePrice = require('../models/LivePrice');
const Product = require('../models/Product');

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function generateAIReply(text) {
  const msg = String(text || '').toLowerCase().trim();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(msg))
    return "Hello! I'm AgroBot, your farming assistant. I can help with crop advice, market prices, pest control, planting seasons, and connecting you with buyers or farmers. What do you need help with today?";

  if (/who are you|what are you|your name|agrobot/.test(msg))
    return "I'm AgroBot, the AI assistant for Agro Tech Connect. I help farmers and buyers with crop information, market prices, farming tips, pest management, and trade connections across Uganda.";

  if (/price|cost|how much|rate|ugx|market price/.test(msg)) {
    const prices = await LivePrice.find().limit(4).lean();
    if (prices.length) {
      const sample = prices.map(p => `${p.crop}: UGX ${Number(p.price).toLocaleString()}/kg`).join(', ');
      return `Current market prices: ${sample}. Prices vary by district and season. Would you like to negotiate a price for a specific crop?`;
    }
    return 'Market prices fluctuate daily. Check the Live Prices section for today\'s rates.';
  }

  if (/maize|corn/.test(msg))
    return 'Maize is Uganda\'s most important staple crop. Best planting seasons are March-April and August-September. Common varieties: LONGE 5, LONGE 6H, SEEDCO SC403. Current market price: UGX 800-1,200/kg.';

  if (/tomato/.test(msg))
    return 'Tomatoes do well in Uganda\'s warm climate. Plant in seedbeds first, transplant at 4-6 weeks. Key diseases: Early Blight, Late Blight — use Mancozeb or Ridomil. Current price: UGX 1,500-3,000/kg.';

  if (/bean|legume/.test(msg))
    return 'Beans are a key protein crop. Plant at start of rains — March or September. Varieties: K132, NABE 4, NABE 15. Current price: UGX 2,000-3,500/kg.';

  if (/cassava/.test(msg))
    return 'Cassava is drought-tolerant. Plant stem cuttings 25-30cm long at 1x1m spacing. Varieties: NASE 14, NASE 19. Harvest at 9-18 months. Current price: UGX 400-700/kg.';

  if (/matooke|banana/.test(msg))
    return 'Matooke is Uganda\'s national food. Plant suckers in well-dug holes 3x3m apart. First harvest at 9-12 months. Price: UGX 500-1,500/bunch.';

  if (/coffee/.test(msg))
    return 'Uganda produces Robusta and Arabica coffee. Plant at 3x3m spacing in partial shade. Export quality fetches UGX 8,000-12,000/kg.';

  if (/pest|disease|spray|pesticide/.test(msg))
    return 'Common pests: Fall Armyworm on maize — spray Emamectin Benzoate. Aphids on vegetables — use Dimethoate or neem oil. Late Blight on tomatoes — Ridomil Gold.';

  if (/fertilizer|soil|compost|manure/.test(msg))
    return 'Soil fertility tips: Test your soil first. Basal dressing: DAP or NPK 17:17:17 at planting. Top dressing: CAN or Urea at 4-6 weeks. Compost improves soil structure.';

  if (/season|when to plant|planting time/.test(msg))
    return 'Uganda planting calendar: Season 1 (March-August): maize, beans, groundnuts. Season 2 (September-February): maize, beans, sweet potatoes. Year-round: cassava, matooke, coffee.';

  if (/bulk|wholesale|large order/.test(msg))
    return 'For bulk purchases: Use the Bulk Inquiry form to send requirements to farmers. Minimum orders typically 100kg+. Bulk buyers get 5-15% discount on listed prices.';

  if (/thank|thanks|appreciate/.test(msg))
    return "You're welcome! Feel free to ask anything else about farming, market prices, or connecting with buyers and farmers.";

  // Check live product listings
  const products = await Product.find({ status: 'active' }).select('name').limit(20).lean();
  const matched = products.find(p => msg.includes(p.name.toLowerCase().split(' ')[0]));
  if (matched)
    return `I see you're asking about ${matched.name}. It's currently listed on our marketplace. You can browse available stock and send a bulk inquiry directly.`;

  const fallbacks = [
    'I can help with crop advice, market prices, pest control, planting seasons, and connecting with buyers or farmers. What would you like to know?',
    'Ask me about any crop — maize, beans, tomatoes, cassava, coffee, matooke, or vegetables. I can also help with fertilizers, irrigation, and market prices.',
    "Try asking: 'When should I plant maize?', 'How do I control tomato blight?', or 'What is the price of beans today?'"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function chatRouter(state) {
  const router = express.Router();

  router.get('/messages', async (req, res) => {
    const messages = await ChatMessage.find().sort({ createdAt: 1 }).limit(100).lean();
    res.json(messages);
  });

  router.post('/messages', async (req, res) => {
    const { text } = req.body || {};
    if (!text || !String(text).trim())
      return res.status(400).json({ error: 'Message text is required.' });

    const replyText = await generateAIReply(text);
    const time = nowTime();

    await ChatMessage.insertMany([
      { sender: 'You', text: String(text).trim(), sent: true },
      { sender: 'Market Assistant', text: replyText, sent: false }
    ]);

    return res.status(201).json({
      sentMessage: { sender: 'You', text: String(text).trim(), time, sent: true },
      replyMessage: { sender: 'Market Assistant', text: replyText, time, sent: false }
    });
  });

  return router;
}

module.exports = { chatRouter };
