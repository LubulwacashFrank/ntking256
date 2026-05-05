const state = {
  products: [],
  prices: [],
  weather: [],
  messages: [],
  announcements: []
};

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderProducts(products) {
  const productsList = document.getElementById("productsList");
  const productsCount = document.getElementById("productsCount");
  productsCount.textContent = `Showing ${products.length} product(s)`;
  productsList.innerHTML = products
    .map(
      (p) => `
      <article class="item">
        <h3>${p.name}</h3>
        <p>${p.district} District</p>
        <p>${p.stock || ''}</p>
        <p class="price">UGX ${p.price.toLocaleString()}/${p.unit}</p>
        <p>Farmer: ${p.farmer}</p>
      </article>
    `
    )
    .join("");
}

function renderPrices(prices) {
  const pricesList = document.getElementById("pricesList");
  pricesList.innerHTML = prices
    .map(
      (p) => `
      <div class="item">
        <strong>${p.crop}</strong>
        <div class="price">UGX ${p.price.toLocaleString()}</div>
        <div class="meta">${p.trend === "up" ? "Up" : "Down"} ${p.change}%</div>
      </div>
    `
    )
    .join("");
}

function renderWeather(weather) {
  const weatherList = document.getElementById("weatherList");
  weatherList.innerHTML = weather
    .map(
      (w) => `
      <div class="item">
        <strong>${w.region}</strong>
        <p>${w.condition} • ${w.temp}C</p>
        <p>Humidity ${w.humidity}% • Rain ${w.rain}% • Wind ${w.wind} km/h</p>
        <p class="meta">${w.advisory}</p>
      </div>
    `
    )
    .join("");
}

function renderMessages(messages) {
  const messagesEl = document.getElementById("messages");
  messagesEl.innerHTML = messages
    .map(
      (m) => `
      <div class="message ${m.sent ? "sent" : "received"}">
        <div><strong>${m.sender}</strong></div>
        <div>${m.text}</div>
        <div class="meta">${m.time}</div>
      </div>
    `
    )
    .join("");
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderAnnouncements(announcements) {
  const container = document.getElementById("announcements");
  const textEl = document.getElementById("announcement-text");

  if (announcements.length > 0) {
    const latest = announcements[0]; // Show the most recent announcement
    textEl.textContent = latest.message;
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

function hideAnnouncement() {
  document.getElementById("announcements").style.display = "none";
}

async function bootstrap() {
  const data = await API.getBootstrap();
  state.products = data.products || [];
  state.prices = data.livePrices || [];
  state.weather = data.weatherData || [];
  state.messages = data.chatMessages || [];
  state.announcements = data.announcements || [];

  renderProducts(state.products);
  renderPrices(state.prices);
  renderWeather(state.weather);
  renderMessages(state.messages);
  renderAnnouncements(state.announcements);
}

async function refreshPrices() {
  try {
    state.prices = await API.getLivePrices();
    renderPrices(state.prices);
  } catch (error) {
    console.error(error);
  }
}

async function refreshAnnouncements() {
  try {
    const data = await API.getBootstrap();
    state.announcements = data.announcements || [];
    renderAnnouncements(state.announcements);
  } catch (error) {
    console.error(error);
  }
}

function bindEvents() {
  document.getElementById("searchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const q = document.getElementById("searchInput").value;
    const district = document.getElementById("districtSelect").value;
    try {
      const products = await API.getProducts({ q, district });
      state.products = products;
      renderProducts(products);
      showToast(`Found ${products.length} product(s)`);
    } catch (error) {
      console.error(error);
      showToast("Search failed");
    }
  });

  document.getElementById("chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    try {
      const result = await API.sendMessage({ text, sender: "You", contactName: "Market Assistant" });
      state.messages.push(result.sentMessage, result.replyMessage);
      renderMessages(state.messages);
      input.value = "";
    } catch (error) {
      console.error(error);
      showToast("Message failed");
    }
  });

  document.getElementById("inquiryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!API.getToken()) {
      showToast("Login first at /auth to submit bulk inquiries");
      return;
    }

    const payload = {
      product: document.getElementById("bulkProduct").value,
      quantity: Number(document.getElementById("bulkQuantity").value),
      targetPrice: Number(document.getElementById("bulkPrice").value),
      location: document.getElementById("bulkLocation").value,
      notes: document.getElementById("bulkNotes").value
    };

    try {
      await API.submitInquiry(payload);
      showToast("Bulk inquiry submitted");
      event.target.reset();
    } catch (error) {
      console.error(error);
      showToast("Inquiry failed");
    }
  });

  // Feedback form
  window.submitFeedbackForm = async () => {
    const name = document.getElementById("feedbackName").value.trim();
    const email = document.getElementById("feedbackEmail").value.trim();
    const category = document.getElementById("feedbackCategory").value;
    const message = document.getElementById("feedbackMessage").value.trim();

    if (!name || !message) {
      showToast("Name and message are required");
      return;
    }

    const btn = document.querySelector('[onclick="submitFeedbackForm()"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; btn.disabled = true; }

    try {
      const result = await API.submitFeedback({ name, email, category, message });
      document.getElementById("feedbackName").value = "";
      document.getElementById("feedbackEmail").value = "";
      document.getElementById("feedbackMessage").value = "";

      // Show AI reply
      const replyBox = document.getElementById("feedbackReply");
      const replyText = document.getElementById("feedbackReplyText");
      if (replyBox && replyText && result.reply) {
        replyText.textContent = result.reply;
        replyBox.style.display = 'block';
        replyBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => { replyBox.style.display = 'none'; }, 12000);
      } else {
        showToast("Feedback submitted successfully!");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to submit feedback");
    } finally {
      if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await bootstrap();
    renderMessages(state.messages);
    bindEvents();
    setInterval(refreshPrices, 30000); // Refresh prices every 30 seconds
    setInterval(refreshAnnouncements, 60000); // Refresh announcements every minute
  } catch (error) {
    console.error(error);
    showToast("Failed to load app");
  }
});

// ==================== CHAT FUNCTIONS ====================
function renderMessages(messages) {
  const messagesArea = document.getElementById("messagesArea");
  if (!messagesArea) return;

  messagesArea.innerHTML = messages.map(msg => `
    <div class="message ${msg.sent ? 'message-sent' : 'message-received'}">
      <div class="message-sender">${msg.sender}</div>
      <div class="message-text">${msg.text}</div>
      <div class="message-time">${msg.time}</div>
    </div>
  `).join("");

  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function openChat() {
  document.getElementById("chatModal").classList.add("active");
  renderMessages(state.messages);
}

function closeChat() {
  document.getElementById("chatModal").classList.remove("active");
}

function sendMessage() {
  document.getElementById("chatForm").dispatchEvent(new Event("submit"));
}

function handleMessageKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
