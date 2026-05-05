const express = require("express");

function generateFeedbackReply(category, message) {
  const msg = String(message || "").toLowerCase();

  if (category === "Chat" || /chat|bot|assistant|ai|reply|response/.test(msg)) {
    return "Thank you for your feedback on the chat feature! Our AgroBot is continuously learning. If the bot gave an incorrect answer, our team will review and improve it. You can also try rephrasing your question for better results.";
  }

  if (category === "Product" || /product|listing|image|photo|price|quality|stock|farmer/.test(msg)) {
    return "Thanks for the product feedback! We take listing quality seriously. If you found incorrect information or a suspicious listing, our admin team will review it within 24 hours. Verified farmers are marked with a badge for your trust.";
  }

  if (category === "Pricing" || /price|expensive|cheap|cost|rate|ugx|overpriced/.test(msg)) {
    return "Thank you for the pricing feedback! Market prices on Agro Tech Connect reflect real-time supply and demand. If you believe a price is unfair, you can negotiate directly with the farmer via the chat or bulk inquiry system. We also publish daily market rates in the Live Prices section.";
  }

  if (category === "Support" || /help|support|problem|issue|bug|error|broken|not working|fix/.test(msg)) {
    return "We're sorry you're experiencing an issue! Our support team has received your report and will respond within 24 hours. For urgent issues, please email support@agrotechconnect.ug. In the meantime, try refreshing the page or clearing your browser cache.";
  }

  if (/slow|loading|performance|speed/.test(msg)) {
    return "Thank you for reporting the performance issue. We're constantly optimizing the platform. Try using a stable internet connection and a modern browser (Chrome or Firefox). Our team will investigate any server-side slowdowns.";
  }

  if (/suggestion|idea|feature|add|improve|would be nice|should have/.test(msg)) {
    return "What a great suggestion! We love hearing ideas from our community. Your feedback has been logged and shared with our product team. We review all suggestions monthly and prioritize the most requested features. Thank you for helping us grow!";
  }

  if (/scam|fraud|fake|suspicious|report/.test(msg)) {
    return "Thank you for reporting this concern. We take fraud and suspicious activity very seriously. Our admin team will investigate immediately. Please avoid sharing personal financial information with unverified users. Verified farmers have a green badge on their profile.";
  }

  if (/good|great|excellent|love|amazing|best|happy|satisfied|thank/.test(msg)) {
    return "Thank you so much for the kind words! It means a lot to our team. We're working hard every day to make Agro Tech Connect the best farm-to-market platform in Uganda. Please spread the word to other farmers and buyers!";
  }

  return "Thank you for your feedback! Your message has been received and logged. Our team reviews all feedback regularly to improve the platform. We appreciate you taking the time to help us serve Uganda's farming community better.";
}

function feedbackRouter(state) {
  const router = express.Router();

  router.post("/", (req, res) => {
    const { name, email, category, message } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Feedback message is required." });
    }

    const feedback = {
      id: Date.now(),
      name: name ? String(name).trim() : "Anonymous",
      email: email ? String(email).trim() : "",
      category: category ? String(category).trim() : "General",
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };

    if (!state.feedbacks) state.feedbacks = [];
    state.feedbacks.unshift(feedback);

    const reply = generateFeedbackReply(feedback.category, feedback.message);
    return res.status(201).json({ message: "Feedback submitted successfully.", feedback, reply });
  });

  router.get("/", (req, res) => {
    res.json(state.feedbacks || []);
  });

  return router;
}

module.exports = { feedbackRouter };