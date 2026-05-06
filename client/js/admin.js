// Admin Panel JavaScript - Full API Integration
// Covers CRUD for products, users, orders, and price management

// ==================== API LAYER ====================
const API_BASE = "/api";
const API = {
  getToken() {
    return localStorage.getItem("agro_token") || "";
  },
  getUser() {
    const token = this.getToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); } catch(e) { return null; }
  },

  authHeaders() {
    return { "Content-Type": "application/json", Authorization: "Bearer " + this.getToken() };
  },

  async getUsers() {
    const response = await fetch(`${API_BASE}/admin/users`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  async getProducts() {
    const response = await fetch(`${API_BASE}/admin/products`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async getInquiries() {
    const response = await fetch(`${API_BASE}/admin/inquiries`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch inquiries");
    return response.json();
  },

  async getPrices() {
    const response = await fetch(`${API_BASE}/admin/prices`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch prices");
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE}/admin/stats`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  async getTransactions() {
    const response = await fetch(`${API_BASE}/admin/transactions`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async createTransaction(payload) {
    const response = await fetch(`${API_BASE}/admin/transactions`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create transaction");
    return response.json();
  },

  async updateTransaction(id, updates) {
    const response = await fetch(`${API_BASE}/admin/transactions/${id}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    return response.json();
  },

  async createProduct(product) {
    const response = await fetch(`${API_BASE}/admin/products`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
  },

  async updateProduct(id, updates) {
    const response = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "DELETE",
      headers: this.authHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },

  async updateUser(id, updates) {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
  },

  async deleteUser(id) {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "DELETE",
      headers: this.authHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete user");
    return response.json();
  },

  async updateInquiry(id, status) {
    const response = await fetch(`${API_BASE}/admin/inquiries/${id}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Failed to update inquiry");
    return response.json();
  },

  async updatePrice(crop, price) {
    const response = await fetch(`${API_BASE}/admin/prices/${encodeURIComponent(crop)}`, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify({ price })
    });
    if (!response.ok) throw new Error("Failed to update price");
    return response.json();
  },

  async adminLogin(payload) {
    const response = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Admin login failed");
    }
    const data = await response.json();
    localStorage.setItem("agro_token", data.token);
    return data;
  },

  async createBroadcast(message, type = "info") {
    const response = await fetch(`${API_BASE}/admin/broadcast`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({ message, type })
    });
    if (!response.ok) throw new Error("Failed to create broadcast");
    return response.json();
  },

  async getBroadcasts() {
    const response = await fetch(`${API_BASE}/admin/broadcast`, { headers: this.authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch broadcasts");
    return response.json();
  },

  async deleteBroadcast(id) {
    const response = await fetch(`${API_BASE}/admin/broadcast/${id}`, {
      method: "DELETE",
      headers: this.authHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete broadcast");
    return response.json();
  },

  logout() {
    localStorage.removeItem("agro_token");
    window.location.href = "/";
  }
};

// Emoji mapping for crops
const cropEmojis = {
  Maize: 'ðŸŒ½',
  Matooke: 'ðŸŒ',
  Cassava: 'ðŸ¥”',
  Tomatoes: 'ðŸ…',
  Beans: 'ðŸ«˜',
  Coffee: 'â˜•',
  Rice: 'ðŸŒ¾',
  Cabbage: 'ðŸ¥¬'
};

// Global data store
let statsData = {};
let usersData = [];
let productsData = [];
let inquiriesData = [];
let pricesData = [];
let chatData = [];
let broadcastData = [];
let financeData = {};
let transactionsData = [];

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async function () {
  // Redirect to admin login if no token
  if (!API.getToken()) {
    window.location.href = "/admin";
    return;
  }
  
  // Verify user is admin
  const user = API.getUser();
  if (!user || user.role !== 'admin') {
    localStorage.removeItem('agro_token');
    window.location.href = "/admin";
    return;
  }
  
  try {
    await loadAllData();
  } catch (e) {
    console.error(e);
    showToast(e.message, true);
    // If unauthorized, redirect to login
    if (e.message.includes('401') || e.message.includes('unauthorized')) {
      localStorage.removeItem('agro_token');
      window.location.href = "/admin";
    }
  }
});

// ==================== DATA LOADING ====================
async function loadAllData() {
  showToast("Loading data...");
  const safe = async (fn, fallback) => { try { return await fn(); } catch(e) { console.error(e.message); return fallback; } };
  const [stats, users, products, inquiries, prices, broadcasts, transactions] = await Promise.all([
    safe(() => API.getStats(), {}),
    safe(() => API.getUsers(), []),
    safe(() => API.getProducts(), []),
    safe(() => API.getInquiries(), []),
    safe(() => API.getPrices(), []),
    safe(() => API.getBroadcasts(), []),
    safe(() => API.getTransactions(), [])
  ]);
  statsData = stats;
  usersData = users;
  productsData = products;
  inquiriesData = inquiries;
  pricesData = prices;
  broadcastData = broadcasts;
  financeData = { totalIncome: stats.totalIncome || 0, totalOutgoing: stats.totalOutgoing || 0, netFlow: stats.netFlow || 0 };
  transactionsData = transactions;
  try { const r = await fetch("/api/chat/messages"); if (r.ok) chatData = await r.json(); } catch(e) {}
  renderDashboard();
  renderProductsTable();
  renderFarmersTable();
  renderBuyersTable();
  renderOrdersTable();
  renderTransactionsTable();
  renderChatConversations();
  renderPricesTable();
  renderBroadcasts();
  initCharts();
  showToast("Data loaded successfully!");
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  // Stat cards
  document.getElementById("totalFarmers").textContent = (statsData.farmers || 0).toLocaleString();
  document.getElementById("totalProducts").textContent = productsData.length.toLocaleString();
  document.getElementById("totalOrders").textContent = inquiriesData.length.toLocaleString();

  const verifiedFarmers = usersData.filter(u => u.role === "farmer" && u.isVerified).length;
  const pendingFarmers = usersData.filter(u => u.role === "farmer" && !u.isVerified).length;
  document.getElementById("verifiedFarmers").textContent = verifiedFarmers;
  document.getElementById("pendingFarmers").textContent = pendingFarmers;

  // Recent Orders (latest 5)
  const recentOrdersList = document.getElementById("recentOrdersList");
  recentOrdersList.innerHTML = inquiriesData.slice(0, 5).map(order => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${getStatusColor(order.status)};color:white;">
        <i class="fas ${getStatusIcon(order.status)}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-text"><strong>${order._id?.slice(-8) || "N/A"}</strong> - ${order.createdBy?.name || "Unknown"}</div>
        <div class="activity-time">${order.product} â€¢ UGX ${Number(order.targetPrice).toLocaleString()}</div>
      </div>
      <span class="status-badge status-${order.status}">${order.status}</span>
    </div>
  `).join("");

  // Latest Products (Dashboard table)
  const productsTableBody = document.getElementById("productsTableBody");
  productsTableBody.innerHTML = productsData.slice(0, 6).map(p => `
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-image-small" style="background:${getCategoryGradient(p.category)}">${getCategoryEmoji(p.category)}</div>
          <div>
            <div class="product-name-cell">${p.name}</div>
            <div class="product-meta-cell">${p.district}</div>
          </div>
        </div>
      </td>
      <td>${p.farmer}</td>
      <td><strong>UGX ${Number(p.price).toLocaleString()}</strong></td>
      <td>${p.stock || "N/A"}</td>
      <td><span class="status-badge ${p.status === "active" ? "status-active" : p.status === "pending" ? "status-pending" : "status-inactive"}">${p.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" title="View"><i class="fas fa-eye"></i></button>
          <button class="action-btn edit" title="Edit" onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" title="Delete" onclick="deleteProduct('${p._id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  // Top Farmers (by product count)
  const topFarmersList = document.getElementById("topFarmersList");
  const topFarmers = usersData
    .filter(u => u.role === "farmer")
    .map(f => ({
      ...f,
      productCount: productsData.filter(p => p.farmer === f.name).length
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5);

  topFarmersList.innerHTML = topFarmers.map((f, idx) => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "#f0fdf4"};color:${idx < 3 ? "white" : "var(--neon-green)"};">
        ${idx < 3 ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-user"></i>'}
      </div>
      <div class="activity-content">
        <div class="activity-text"><strong>${f.name}</strong></div>
        <div class="activity-time">${f.productCount} products â€¢ ${f.district}</div>
      </div>
      <div style="font-weight:800;color:var(--warning);font-size:1.1rem;">${f.rating || "-"} â­</div>
    </div>
  `).join("");

  // Activity Feed
  const activityFeed = document.getElementById("activityFeed");
  const activities = [
    { icon: "fa-cogs", color: "#00D4FF", text: "Admin dashboard loaded", time: "Just now" }
  ];
  activityFeed.innerHTML = activities.map(act => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${act.color};color:white;">
        <i class="fas ${act.icon}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-text">${act.text}</div>
        <div class="activity-time">${act.time}</div>
      </div>
    </div>
  `).join("");

  // Nav badges
  const productBadge = document.querySelector('[data-section="products"] .nav-badge');
  if (productBadge) productBadge.textContent = productsData.length;
  const farmerBadge = document.querySelector('[data-section="farmers"] .nav-badge');
  if (farmerBadge) farmerBadge.textContent = pendingFarmers;
  const orderBadge = document.querySelector('[data-section="orders"] .nav-badge');
  if (orderBadge) orderBadge.textContent = inquiriesData.length;
}

// ==================== PRODUCTS ====================
function renderProductsTable(filterData = {}) {
  let filtered = productsData.slice();

  if (filterData.search) {
    const term = filterData.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.farmer.toLowerCase().includes(term) ||
      p.district.toLowerCase().includes(term)
    );
  }
  if (filterData.category) {
    filtered = filtered.filter(p => p.category === filterData.category);
  }
  if (filterData.status) {
    filtered = filtered.filter(p => p.status === filterData.status);
  }

  const tbody = document.getElementById("allProductsTableBody");
  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><strong>#${String(p._id).slice(-6)}</strong></td>
      <td>
        <div class="product-cell">
          <div class="product-image-small" style="background:${getCategoryGradient(p.category)}">${getCategoryEmoji(p.category)}</div>
          <div><div class="product-name-cell">${p.name}</div></div>
        </div>
      </td>
      <td style="text-transform:capitalize;">${p.category}</td>
      <td>${p.farmer}</td>
      <td>${p.district}</td>
      <td><strong>UGX ${Number(p.price).toLocaleString()}</strong>/${p.unit}</td>
      <td>${p.stock}</td>
      <td><span class="status-badge ${p.status === "active" ? "status-active" : p.status === "pending" ? "status-pending" : "status-inactive"}">${p.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" title="View"><i class="fas fa-eye"></i></button>
          <button class="action-btn edit" title="Edit" onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" title="Delete" onclick="deleteProduct('${p._id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  const badge = document.querySelector('[data-section="products"] .nav-badge');
  if (badge) badge.textContent = filtered.length;
}

function filterProducts() {
  const search = document.getElementById("productSearchInput").value;
  const category = document.getElementById("productCategoryFilter").value;
  const status = document.getElementById("productStatusFilter").value;
  renderProductsTable({ search, category, status });
}

function openProductModal(productId = null) {
  const modal = document.getElementById("productModal");
  const title = document.getElementById("productModalTitle");
  const f = {
    id: document.getElementById("productId"),
    name: document.getElementById("productName"),
    category: document.getElementById("productCategory"),
    price: document.getElementById("productPrice"),
    unit: document.getElementById("productUnit"),
    farmer: document.getElementById("productFarmer"),
    district: document.getElementById("productDistrict"),
    stock: document.getElementById("productStock"),
    status: document.getElementById("productStatus"),
    verified: document.getElementById("badgeVerified"),
    featured: document.getElementById("badgeFeatured"),
    fresh: document.getElementById("badgeFresh")
  };

  if (productId) {
    const p = productsData.find(p => String(p._id) === String(productId));
    if (p) {
      title.textContent = "Edit Product";
      f.id.value = p._id;
      f.name.value = p.name;
      f.category.value = p.category;
      f.price.value = p.price;
      f.unit.value = p.unit;
      f.farmer.value = p.farmer;
      f.district.value = p.district;
      f.stock.value = p.stock;
      f.status.value = p.status;
      f.verified.checked = p.verified;
      f.featured.checked = p.featured;
      f.fresh.checked = p.fresh;
    }
  } else {
    title.textContent = "Add New Product";
    f.id.value = "";
    f.name.value = "";
    f.category.value = "";
    f.price.value = "";
    f.unit.value = "kg";
    f.farmer.value = "";
    f.district.value = "";
    f.stock.value = "";
    f.status.value = "active";
    f.verified.checked = false;
    f.featured.checked = false;
    f.fresh.checked = false;
  }
  modal.classList.add("active");
}

async function saveProduct() {
  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = parseInt(document.getElementById("productPrice").value, 10);
  const unit = document.getElementById("productUnit").value;
  const farmer = document.getElementById("productFarmer").value.trim();
  const district = document.getElementById("productDistrict").value.trim();
  const stock = document.getElementById("productStock").value.trim();
  const status = document.getElementById("productStatus").value;
  const verified = document.getElementById("badgeVerified").checked;
  const featured = document.getElementById("badgeFeatured").checked;
  const fresh = document.getElementById("badgeFresh").checked;

  if (!name || !category || !price || !farmer || !district) {
    showToast("Please fill all required fields", "error");
    return;
  }

  try {
    if (id) {
      await API.updateProduct(id, { name, category, price, unit, farmer, district, stock, status, verified, featured, fresh });
      showToast("Product updated successfully");
    } else {
      await API.createProduct({ name, category, price, unit, farmer, district, stock, status, verified, featured, fresh });
      showToast("Product added successfully");
    }
    closeModal("productModal");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    await API.deleteProduct(id);
    showToast("Product deleted successfully");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function editProduct(id) {
  openProductModal(id);
}

// ==================== FARMERS ====================
function renderFarmersTable(searchTerm = "") {
  let farmers = usersData.filter(u => u.role === "farmer");

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    farmers = farmers.filter(
      f => f.name.toLowerCase().includes(term) || f.email.toLowerCase().includes(term) || f.district.toLowerCase().includes(term)
    );
  }

  const farmersWithStats = farmers.map(f => ({
    ...f,
    productCount: productsData.filter(p => p.farmer === f.name).length
  }));

  const tbody = document.getElementById("farmersTableBody");
  tbody.innerHTML = farmersWithStats.map(f => `
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-image-small" style="background:linear-gradient(135deg,var(--neon-green),var(--electric-green));color:var(--dark-bg);font-weight:800;">${f.name.split(" ").map(n => n[0]).join("").substring(0,2)}</div>
          <div>
            <div class="product-name-cell">${f.name}</div>
            <div class="product-meta-cell">${f.email}</div>
          </div>
        </div>
      </td>
      <td>${f.district}</td>
      <td><strong>${f.productCount}</strong></td>
      <td><span style="color:var(--warning);font-weight:700;">${f.rating || "-"} â­</span></td>
      <td><span class="status-badge ${f.isVerified ? "status-verified" : "status-pending"}">${f.isVerified ? "Verified" : "Pending"}</span></td>
      <td>${f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "-"}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" title="View"><i class="fas fa-eye"></i></button>
          ${!f.isVerified ? `<button class="action-btn approve" title="Approve" onclick="approveFarmer('${f._id || f.id}')"><i class="fas fa-check"></i></button>` : ""}
          <button class="action-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  document.getElementById("verifiedFarmers").textContent = usersData.filter(u => u.role === "farmer" && u.isVerified).length;
  document.getElementById("pendingFarmers").textContent = usersData.filter(u => u.role === "farmer" && !u.isVerified).length;
}

function filterFarmers() {
  const term = document.getElementById("farmerSearchInput").value;
  renderFarmersTable(term);
}

async function approveFarmer(userId) {
  try {
    await API.updateUser(userId, { isVerified: true });
    showToast("Farmer approved!");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==================== BUYERS ====================
function renderBuyersTable(searchTerm = "") {
  let buyers = usersData.filter(u => u.role === "bulk_buyer");
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    buyers = buyers.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.email.toLowerCase().includes(term) ||
      (b.district || "").toLowerCase().includes(term)
    );
  }
  const tbody = document.getElementById("buyersTableBody");
  if (!tbody) return;
  tbody.innerHTML = buyers.map(b => `
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-image-small" style="background:linear-gradient(135deg,var(--ocean-blue),#0099ff);color:white;font-weight:800;font-size:1rem;">${b.name.split(" ").map(n=>n[0]).join("").substring(0,2)}</div>
          <div>
            <div class="product-name-cell">${b.name}</div>
            <div class="product-meta-cell">${b.organization || ""}</div>
          </div>
        </div>
      </td>
      <td>${b.email}</td>
      <td>${b.district || "-"}</td>
      <td>${b.organization || "-"}</td>
      <td>${inquiriesData.filter(i => i.createdBy && (i.createdBy._id === b._id || i.createdBy === b._id)).length}</td>
      <td>${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn delete" title="Delete" onclick="deleteUser('${b._id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

function filterBuyers() {
  const term = document.getElementById("buyerSearchInput")?.value || "";
  renderBuyersTable(term);
}

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  try {
    await API.deleteUser(id);
    showToast("User deleted");
    loadAllData();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ==================== ORDERS ====================
// ==================== ORDERS ====================
function renderOrdersTable(statusFilter = "") {
  let filtered = inquiriesData.slice();
  if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);

  const el = id => document.getElementById(id);
  if (el("ordersCompleted")) el("ordersCompleted").textContent = inquiriesData.filter(o => o.status === "completed").length;
  if (el("ordersProcessing")) el("ordersProcessing").textContent = inquiriesData.filter(o => o.status === "processing").length;
  if (el("ordersPending")) el("ordersPending").textContent = inquiriesData.filter(o => o.status === "pending").length;

  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = filtered.map(o => {
    const total = Number(o.targetPrice || 0) * Number(o.quantity || 0);
    const buyer = o.createdBy?.name || "Guest";
    const phone = o.notes?.match(/Phone:\s*([^|]+)/)?.[1]?.trim() || o.location || "-";
    const method = o.notes?.match(/Payment:\s*([^|]+)/)?.[1]?.trim() || "-";
    const pid = o.product.replace(/'/g, "\\'");
    const approveBtn = o.status === "pending"
      ? `<button class="action-btn approve" style="background:#10B981;color:white" title="Approve" onclick="updateOrderStatus('${o._id}','processing')"><i class="fas fa-play"></i></button>`
      : "";
    const completeBtn = o.status === "processing"
      ? `<button class="action-btn approve" style="background:#059669;color:white" title="Complete" onclick="confirmComplete('${o._id}','${pid}',${total})"><i class="fas fa-check"></i></button>`
      : "";
    const cancelBtn = (o.status === "pending" || o.status === "processing")
      ? `<button class="action-btn delete" title="Cancel" onclick="updateOrderStatus('${o._id}','cancelled')"><i class="fas fa-times"></i></button>`
      : "";
    return `<tr>
      <td><strong>#${o._id?.slice(-8)}</strong></td>
      <td><div style="font-weight:700">${buyer}</div><div style="font-size:11px;color:#6B7280">${phone}</div></td>
      <td>${o.product}</td>
      <td>${o.quantity} kg</td>
      <td><div style="font-size:11px;color:#6B7280">@ UGX ${Number(o.targetPrice).toLocaleString()}/kg</div><div style="font-weight:800;color:#059669">UGX ${total.toLocaleString()}</div></td>
      <td><div>${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</div><div style="font-size:11px;color:#6B7280">${method}</div></td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td><div class="action-btns">
        <button class="action-btn view" title="View" onclick="viewOrderDetail('${o._id}')"><i class="fas fa-eye"></i></button>
        ${approveBtn}${completeBtn}${cancelBtn}
      </div></td>
    </tr>`;
  }).join("");
}

function viewOrderDetail(orderId) {
  const o = inquiriesData.find(x => x._id === orderId);
  if (!o) return;
  const total = Number(o.targetPrice || 0) * Number(o.quantity || 0);
  const commission = Math.round(total * 0.05);
  const payout = total - commission;
  const buyer = o.createdBy?.name || "Guest";
  const farmerPayout = o.createdBy?.payoutPhone || o.createdBy?.payoutAccount
    ? `<div style="background:#EFF6FF;border-radius:12px;padding:14px;border-left:4px solid #3B82F6">
        <div style="font-weight:700;font-size:12px;color:#1D4ED8;margin-bottom:8px"><i class="fas fa-university"></i> Farmer Payout Details</div>
        ${o.createdBy?.payoutPhone ? `<div style="font-size:12px;color:#374151;margin-bottom:4px"><strong>Mobile Money:</strong> ${o.createdBy.payoutPhone}</div>` : ""}
        ${o.createdBy?.payoutAccount ? `<div style="font-size:12px;color:#374151;margin-bottom:4px"><strong>Account:</strong> ${o.createdBy.payoutAccount}</div>` : ""}
        ${o.createdBy?.payoutBank ? `<div style="font-size:12px;color:#374151"><strong>Bank:</strong> ${o.createdBy.payoutBank}</div>` : ""}
      </div>`
    : `<div style="background:#FEF3C7;border-radius:10px;padding:12px;font-size:12px;color:#92400E"><i class="fas fa-exclamation-triangle"></i> Farmer has not provided payout details.</div>`;
  const sc = { pending: "#F59E0B", processing: "#3B82F6", completed: "#10B981", cancelled: "#EF4444" };
  const pid = o.product.replace(/'/g, "\\'");
  const approveAction = o.status === "pending"
    ? `<button onclick="updateOrderStatus('${o._id}','processing');this.closest('.modal-overlay').remove()" style="flex:1;padding:10px;background:#10B981;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Approve</button>`
    : "";
  const completeAction = o.status === "processing"
    ? `<button onclick="confirmComplete('${o._id}','${pid}',${total},'${o.createdBy?.payoutPhone||""}','${o.createdBy?.payoutAccount||""}','${o.createdBy?.payoutBank||""}');this.closest('.modal-overlay').remove()" style="flex:1;padding:10px;background:#059669;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Mark Completed</button>`
    : "";
  const m = document.createElement("div");
  m.className = "modal-overlay active";
  m.innerHTML = `<div class="modal" style="max-width:520px">
    <div class="modal-header">
      <h3 class="modal-title">Order #${o._id?.slice(-8)}</h3>
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;font-size:1.1rem">${o.product}</span>
        <span style="background:${sc[o.status]};color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">${o.status.toUpperCase()}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:#f8fafc;border-radius:10px;padding:12px"><div style="font-size:11px;color:#6B7280">Buyer</div><div style="font-weight:700">${buyer}</div></div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px"><div style="font-size:11px;color:#6B7280">Quantity</div><div style="font-weight:700">${o.quantity} kg</div></div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px"><div style="font-size:11px;color:#6B7280">Price/kg</div><div style="font-weight:700">UGX ${Number(o.targetPrice).toLocaleString()}</div></div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px"><div style="font-size:11px;color:#6B7280">Location</div><div style="font-weight:700">${o.location || "-"}</div></div>
      </div>
      <div style="background:#FFF9C4;border-radius:12px;padding:14px;border-left:4px solid #F59E0B">
        <div style="font-weight:700;font-size:12px;color:#92400E;margin-bottom:6px"><i class="fas fa-building-columns"></i> Payment Received Into</div>
        <div style="font-size:13px;color:#374151"><strong>Equity Bank &mdash; Acc: 1003102577764</strong></div>
        <div style="font-size:12px;color:#6B7280">Account Name: Daniel Seryazi (Platform Account)</div>
      </div>
      <div style="background:#f0fdf4;border-radius:12px;padding:16px;border-left:4px solid #10B981">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#6B7280">Order Total</span><span style="font-weight:900;font-size:1.2rem;color:#059669">UGX ${total.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:#6B7280">Platform Commission (5%)</span><span style="font-size:12px;font-weight:700;color:#F59E0B">UGX ${commission.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:#6B7280">Farmer Payout (95%)</span><span style="font-size:12px;font-weight:700;color:#059669">UGX ${payout.toLocaleString()}</span></div>
      </div>
      ${farmerPayout}
      ${o.notes ? `<div style="background:#F3F4F6;border-radius:10px;padding:12px;font-size:13px"><strong>Notes:</strong> ${o.notes}</div>` : ""}
      <div style="display:flex;gap:8px">
        ${approveAction}${completeAction}
        <button onclick="this.closest('.modal-overlay').remove()" style="flex:1;padding:10px;background:#F3F4F6;color:#374151;border:none;border-radius:8px;font-weight:700;cursor:pointer">Close</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(m);
}

function confirmComplete(orderId, product, total, payoutPhone, payoutAccount, payoutBank) {
  const commission = Math.round(total * 0.05);
  const payout = total - commission;
  const payoutInfo = (payoutPhone || payoutAccount)
    ? `<div style="background:#EFF6FF;border-radius:10px;padding:12px;margin-bottom:16px;text-align:left">
        <div style="font-weight:700;font-size:12px;color:#1D4ED8;margin-bottom:6px"><i class="fas fa-paper-plane"></i> Send UGX ${payout.toLocaleString()} to Farmer via:</div>
        ${payoutPhone ? `<div style="font-size:13px;color:#374151;margin-bottom:3px"><i class="fas fa-mobile-alt" style="color:#10B981;width:16px"></i> Mobile Money: <strong>${payoutPhone}</strong></div>` : ""}
        ${payoutAccount ? `<div style="font-size:13px;color:#374151;margin-bottom:3px"><i class="fas fa-university" style="color:#3B82F6;width:16px"></i> Account: <strong>${payoutAccount}</strong></div>` : ""}
        ${payoutBank ? `<div style="font-size:13px;color:#374151"><i class="fas fa-building" style="color:#6B7280;width:16px"></i> Bank: <strong>${payoutBank}</strong></div>` : ""}
      </div>`
    : `<div style="background:#FEF3C7;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400E"><i class="fas fa-exclamation-triangle"></i> No payout details on file. Contact farmer directly.</div>`;
  const m = document.createElement("div");
  m.className = "modal-overlay active";
  m.innerHTML = `<div class="modal" style="max-width:440px">
    <div class="modal-body" style="padding:28px">
      <div style="font-size:2.5rem;margin-bottom:12px;text-align:center">&#x2705;</div>
      <h3 style="font-weight:900;margin-bottom:8px;text-align:center">Complete Order?</h3>
      <p style="color:#6B7280;margin-bottom:16px;text-align:center;font-size:14px">Completing <strong>${product}</strong> will record these transactions:</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#6B7280">Total Received</span><span style="font-weight:800;color:#059669">UGX ${total.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#6B7280">Platform keeps (5%)</span><span style="font-weight:700;color:#F59E0B">UGX ${commission.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #D1FAE5"><span style="color:#6B7280;font-weight:700">Send to Farmer</span><span style="font-weight:800;color:#3B82F6;font-size:1.1rem">UGX ${payout.toLocaleString()}</span></div>
      </div>
      ${payoutInfo}
      <div style="background:#FFF9C4;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400E">
        <i class="fas fa-building-columns"></i> <strong>Platform Account:</strong> Equity Bank &mdash; 1003102577764 (Daniel Seryazi)
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="updateOrderStatus('${orderId}','completed');this.closest('.modal-overlay').remove()" style="flex:1;padding:12px;background:#059669;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px"><i class="fas fa-check"></i> Confirm &amp; Complete</button>
        <button onclick="this.closest('.modal-overlay').remove()" style="flex:1;padding:12px;background:#F3F4F6;color:#374151;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">Cancel</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(m);
}

function filterOrders() {
  const filter = document.getElementById("orderStatusFilter").value;
  renderOrdersTable(filter);
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await API.updateInquiry(orderId, newStatus);
    showToast(`Order marked as ${newStatus}`);
    loadAllData();
  } catch (err) { showToast(err.message, "error"); }
}

// ==================== TRANSACTIONS ====================
function renderTransactionsTable() {
  const el = id => document.getElementById(id);
  if (el("totalIncome")) el("totalIncome").textContent = `UGX ${(financeData.totalIncome || 0).toLocaleString()}`;
  if (el("totalOutgoing")) el("totalOutgoing").textContent = `UGX ${(financeData.totalOutgoing || 0).toLocaleString()}`;
  if (el("netFlow")) el("netFlow").textContent = `UGX ${(financeData.netFlow || 0).toLocaleString()}`;
  if (el("transactionCount")) el("transactionCount").textContent = transactionsData.length;

  const tbody = document.getElementById("transactionsTableBody");
  if (!tbody) return;
  if (!transactionsData.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#9CA3AF">No transactions yet</td></tr>';
    return;
  }
  tbody.innerHTML = transactionsData.map(t => `
    <tr>
      <td><span class="status-badge ${t.type === 'income' ? 'status-active' : 'status-inactive'}">${t.type}</span></td>
      <td><strong>UGX ${Number(t.amount).toLocaleString()}</strong></td>
      <td>${t.party || '-'}</td>
      <td>${t.category || '-'}</td>
      <td>${t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}</td>
      <td>${t.notes || '-'}</td>
      <td><span class="status-badge ${t.status === 'completed' ? 'status-active' : 'status-pending'}">${t.status || 'completed'}</span></td>
    </tr>
  `).join('');
}

function openTransactionModal() {
  // For now, just show a toast
  showToast("Transaction modal coming soon!", "info");
}

// ==================== CHATS ====================
function renderChatConversations() {
  const list = document.getElementById("chatConversationsList");
  if (!list) return;
  list.innerHTML = `
    <div class="activity-item">
      <div class="activity-icon" style="background:linear-gradient(135deg,#00FF41,#39FF14);color:white;">
        <i class="fas fa-comments"></i>
      </div>
      <div class="activity-content">
        <div class="activity-text">Chat monitoring active. ${chatData.length} messages in system.</div>
        <div class="activity-time">Real-time chat integration available</div>
      </div>
    </div>
  `;
}

// ==================== PRICES ====================
function renderPricesTable() {
  const tbody = document.getElementById("pricesTableBody");
  tbody.innerHTML = pricesData.map(p => `
    <tr>
      <td><strong>${cropEmojis[p.crop] || ''} ${p.crop}</strong></td>
      <td style="font-size:1.1rem;font-weight:800;color:var(--neon-green);">UGX ${Number(p.price).toLocaleString()}</td>
      <td style="color:var(--text-secondary);">UGX ${p.previousPrice ? Number(p.previousPrice).toLocaleString() : "-"}</td>
      <td>
        <span class="${p.trend === "up" ? "trend-up" : "trend-down"}" style="padding:4px 10px;border-radius:8px;font-weight:700;font-size:0.85rem;">
          ${p.trend === "up" ? "â†‘" : "â†“"} ${p.change}%
        </span>
      </td>
      <td>${p.lastUpdated || "Just now"}</td>
      <td><i class="fas fa-arrow-${p.trend === "up" ? "up" : "down"}" style="color:${p.trend === "up" ? "var(--neon-green)" : "var(--danger)"}"></i></td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit Price" onclick="editPrice('${p.crop}')"><i class="fas fa-edit"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openPriceModal() {
  document.getElementById("priceModal").classList.add("active");
}

function editPrice(crop) {
  const p = pricesData.find(p => p.crop.toLowerCase() === crop.toLowerCase());
  if (p) {
    document.getElementById("priceCrop").value = p.crop;
    document.getElementById("priceValue").value = p.price;
    openPriceModal();
  }
}

async function savePrice() {
  const crop = document.getElementById("priceCrop").value;
  const price = parseInt(document.getElementById("priceValue").value, 10);
  if (!price || price <= 0) {
    showToast("Please enter a valid price", "error");
    return;
  }

  try {
    await API.updatePrice(crop, price);
    showToast(`Price updated for ${crop}`);
    closeModal("priceModal");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==================== NAVIGATION ====================
function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const sectionEl = document.getElementById(`section-${sectionId}`);
  if (!sectionEl) {
    showToast(`"${sectionId}" section is coming soon.`);
    sectionId = "dashboard";
    document.getElementById("section-dashboard").classList.add("active");
  } else {
    sectionEl.classList.add("active");
  }

  const navItem = document.querySelector(`[data-section="${sectionId}"]`);
  if (navItem) navItem.classList.add("active");

    const titles = {
    dashboard: { title: "Dashboard Overview", subtitle: "Welcome back! Here's what's happening today." },
    products: { title: "Products Management", subtitle: "Manage all products in the marketplace." },
    farmers: { title: "Farmer Management", subtitle: "View and manage registered farmers." },
    buyers: { title: "Buyer Management", subtitle: "View and manage bulk buyers." },
    orders: { title: "Order Management", subtitle: "Track and manage bulk inquiries." },
    chats: { title: "Chat Monitor", subtitle: "Monitor all conversations." },
    broadcast: { title: "Announcements", subtitle: "Create and manage platform announcements." },
    prices: { title: "Price Management", subtitle: "Update and monitor market prices." },
    payments: { title: "Payments", subtitle: "Review and confirm buyer payments." }
,
    "direct-orders": { title: "Direct Orders", subtitle: "Manage public and buyer direct orders." },
    reviews: { title: "Ratings & Reviews", subtitle: "Monitor buyer ratings and farmer reviews." },
    analytics: { title: "Analytics", subtitle: "View platform analytics." },
    settings: { title: "Settings", subtitle: "Configure platform settings." },
    transactions: { title: "Transactions", subtitle: "Track all financial transactions." }
  };

  if (titles[sectionId]) {
    document.getElementById("pageTitle").textContent = titles[sectionId].title;
    document.getElementById("pageSubtitle").textContent = titles[sectionId].subtitle;
  }

  if (sectionId === "buyers") renderBuyersTable();
  if (sectionId === "farmers") renderFarmersTable();
  if (sectionId === "products") renderProductsTable();
  if (sectionId === "orders") renderOrdersTable();
  if (sectionId === "transactions") renderTransactionsTable();
  if (sectionId === "prices") renderPricesTable();
  if (sectionId === "broadcast") renderBroadcasts();
  if (sectionId === "reviews") loadAndRenderReviews();
  if (sectionId === "payments") loadAndRenderPayments();
  if (sectionId === 'direct-orders') loadAndRenderDirectOrders();

  // Close mobile sidebar
  document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ==================== UTILITIES ====================
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toastNotification");
  if (toast) {
    toast.textContent = message;
    toast.className = `toast show ${isError ? "error" : ""}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

function getStatusColor(status) {
  const colors = { completed: "#10b981", processing: "#f59e0b", pending: "#8b5cf6", cancelled: "#ef4444" };
  return colors[status] || "#6b7280";
}

function getStatusIcon(status) {
  const icons = { completed: "fa-check-circle", processing: "fa-spinner", pending: "fa-clock", cancelled: "fa-times-circle" };
  return icons[status] || "fa-circle";
}

function getCategoryGradient(category) {
  const map = {
    grains: "linear-gradient(135deg, #FFF9C4, #FFF176)",
    fruits: "linear-gradient(135deg, #FFCCBC, #FFAB91)",
    vegetables: "linear-gradient(135deg, #C8E6C9, #A5D6A7)",
    tubers: "linear-gradient(135deg, #FFE0B2, #FFCC80)",
    legumes: "linear-gradient(135deg, #DCEDC8, #C5E1A5)",
    coffee: "linear-gradient(135deg, #EFEBE9, #D7CCC8)"
  };
  return map[category] || "#e5e7eb";
}

function getCategoryEmoji(category) {
  const map = { grains: "ðŸŒ¾", fruits: "ðŸŽ", vegetables: "ðŸ¥¬", tubers: "ðŸ¥”", legumes: "ðŸ«˜", coffee: "â˜•" };
  return map[category] || "ðŸ“¦";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function updateChart(period) {
  showToast(`Showing data for ${period}...`);
}

function saveSettings() {
  showToast("Settings saved successfully!");
}

// ==================== CHARTS ====================
function initCharts() {
  // Sales Chart
  const salesCanvas = document.getElementById("salesChart");
  if (salesCanvas) {
    const ctx = salesCanvas.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Sales (UGX Millions)",
          data: [4.2, 5.1, 4.8, 6.2, 5.9, 7.3, 6.8],
          borderColor: "#00FF41",
          backgroundColor: "rgba(0, 255, 65, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#00FF41",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Chat Stats Chart
  const chatCanvas = document.getElementById("chatStatsChart");
  if (chatCanvas) {
    const ctx = chatCanvas.getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Active", "Waiting", "Resolved"],
        datasets: [{ data: [5, 3, 8], backgroundColor: ["#00FF41", "#FF6B35", "#BF00FF"], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // Revenue Chart
  const revenueCanvas = document.getElementById("revenueChart");
  if (revenueCanvas) {
    const ctx = revenueCanvas.getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [{
          label: "Revenue (Millions UGX)",
          data: [32, 38, 35, 42, 48, 45, 52, 58, 55, 62, 68, 72],
          backgroundColor: [
            "rgba(0, 255, 65, 0.8)",
            "rgba(0, 212, 255, 0.8)",
            "rgba(255, 107, 53, 0.8)",
            "rgba(191, 0, 255, 0.8)"
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Region Chart
  const regionCanvas = document.getElementById("regionChart");
  if (regionCanvas) {
    const ctx = regionCanvas.getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Central", "Eastern", "Western", "Northern"],
        datasets: [{ data: [35, 28, 22, 15], backgroundColor: ["#00FF41", "#00D4FF", "#FF6B35", "#BF00FF"], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // Category Chart
  const categoryCanvas = document.getElementById("categoryChart");
  if (categoryCanvas) {
    const ctx = categoryCanvas.getContext("2d");
    new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: ["Grains", "Fruits", "Vegetables", "Tubers", "Legumes", "Coffee"],
        datasets: [{
          data: [245, 189, 312, 156, 178, 98],
          backgroundColor: [
            "rgba(0, 255, 65, 0.7)",
            "rgba(255, 107, 53, 0.7)",
            "rgba(0, 212, 255, 0.7)",
            "rgba(191, 0, 255, 0.7)",
            "rgba(255, 20, 147, 0.7)",
            "rgba(245, 158, 11, 0.7)"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }
}

// ==================== BROADCASTS ====================
function renderBroadcasts() {
  const broadcastList = document.getElementById("broadcastList");
  if (!broadcastList) return;

  broadcastList.innerHTML = broadcastData.map(broadcast => `
    <div class="broadcast-item">
      <div class="broadcast-header">
        <span class="broadcast-type ${broadcast.type || 'info'}">${broadcast.type || 'info'}</span>
        <div class="broadcast-actions">
          <button class="action-btn delete" title="Delete" onclick="deleteBroadcast(${broadcast.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="broadcast-message">${broadcast.message}</div>
      <div class="broadcast-meta">
        Created: ${new Date(broadcast.timestamp).toLocaleString()}
      </div>
    </div>
  `).join("");
}

function openBroadcastModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay active";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Create Announcement</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="broadcastForm">
          <div class="form-group">
            <label>Message</label>
            <textarea id="broadcastMessage" rows="4" placeholder="Enter your announcement message..." required></textarea>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="broadcastType">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('active')">Cancel</button>
        <button class="btn btn-primary" onclick="createBroadcast()">Create Announcement</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function createBroadcast() {
  const message = document.getElementById("broadcastMessage").value.trim();
  const type = document.getElementById("broadcastType").value;

  if (!message) {
    showToast("Please enter a message", "error");
    return;
  }

  try {
    await API.createBroadcast(message, type);
    showToast("Announcement created successfully!");
    document.querySelector(".modal-overlay").classList.remove("active");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteBroadcast(id) {
  if (!confirm("Are you sure you want to delete this announcement?")) return;

  try {
    await API.deleteBroadcast(id);
    showToast("Announcement deleted!");
    loadAllData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==================== REVIEWS ====================
async function loadAndRenderReviews() {
  const el = document.getElementById('reviews-body');
  if (!el) return;
  try {
    const token = API.getToken();
    const res = await fetch('/api/reviews/all', { headers: { Authorization: 'Bearer ' + token } });
    const reviews = res.ok ? await res.json() : [];
    if (!reviews.length) {
      el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#9CA3AF">No reviews yet</td></tr>';
      return;
    }
    el.innerHTML = reviews.map(r => {
      const stars = 'â˜…'.repeat(r.rating) + 'â˜†'.repeat(5 - r.rating);
      return `<tr>
        <td><strong>${r.productId?.name || 'Product'}</strong></td>
        <td>${r.reviewerId?.name || 'Buyer'}</td>
        <td style="color:#F59E0B;font-size:1.1rem;letter-spacing:2px">${stars}</td>
        <td>${r.comment || '-'}</td>
        <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
        <td><button class="action-btn delete" onclick="deleteReview('${r._id}')"><i class="fas fa-trash"></i></button></td>
      </tr>`;
    }).join('');
  } catch(e) { showToast(e.message, true); }
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    const token = API.getToken();
    await fetch('/api/reviews/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    showToast('Review deleted');
    loadAndRenderReviews();
  } catch(e) { showToast(e.message, true); }
}

// ==================== PAYMENTS ====================
async function loadAndRenderPayments() {
  const el = document.getElementById('payments-body');
  if (!el) return;
  try {
    const token = API.getToken();
    const res = await fetch('/api/payments', { headers: { Authorization: 'Bearer ' + token } });
    const payments = res.ok ? await res.json() : [];
    if (!payments.length) {
      el.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#9CA3AF">No payments yet</td></tr>';
      return;
    }
    const statusBg = { pending: '#FEF3C7', paid: '#D1FAE5', failed: '#FEE2E2' };
    const statusColor = { pending: '#92400E', paid: '#065F46', failed: '#991B1B' };
    el.innerHTML = payments.map(p => `<tr>
      <td><strong>${p.reference || p._id?.slice(-8)}</strong></td>
      <td>${p.buyerId?.name || 'Buyer'}</td>
      <td>${p.inquiryId?.product || '-'} &bull; ${p.inquiryId?.quantity || 0}kg</td>
      <td><strong>UGX ${Number(p.amount).toLocaleString()}</strong></td>
      <td>${p.method === 'mobile_money' ? 'ðŸ“± Mobile Money' : 'ðŸ¦ Bank'} &bull; ${p.phone || '-'}</td>
      <td><span style="background:${statusBg[p.status]||'#F3F4F6'};color:${statusColor[p.status]||'#374151'};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">${p.status}</span></td>
      <td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
      <td>
        <div class="action-btns">
          ${p.status === 'pending' ? `<button class="action-btn approve" title="Confirm" onclick="confirmPayment('${p._id}')"><i class="fas fa-check"></i></button><button class="action-btn delete" title="Reject" onclick="rejectPayment('${p._id}')"><i class="fas fa-times"></i></button>` : ''}
        </div>
      </td>
    </tr>`).join('');
  } catch(e) { showToast(e.message, true); }
}

async function confirmPayment(id) {
  try {
    const token = API.getToken();
    await fetch('/api/payments/' + id + '/confirm', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    showToast('Payment confirmed! Order marked completed.');
    loadAndRenderPayments();
    loadAllData();
  } catch(e) { showToast(e.message, true); }
}

async function rejectPayment(id) {
  if (!confirm('Reject this payment?')) return;
  try {
    const token = API.getToken();
    await fetch('/api/payments/' + id + '/reject', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    showToast('Payment rejected.');
    loadAndRenderPayments();
  } catch(e) { showToast(e.message, true); }
}


// ==================== DIRECT ORDERS ====================
async function loadAndRenderDirectOrders() {
  const token = localStorage.getItem("agro_token");
  try {
    const res = await fetch("/api/orders", { headers: { Authorization: "Bearer " + token } });
    const orders = await res.json();
    const tbody = document.getElementById("direct-orders-body");
    if (!tbody) return;
    if (!orders.length) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:32px;color:#9CA3AF">No orders yet</td></tr>'; return; }
    const sColor = { pending: "#F59E0B", confirmed: "#10B981", rejected: "#EF4444" };
    const sBg = { pending: "#FEF3C7", confirmed: "#D1FAE5", rejected: "#FEE2E2" };
    tbody.innerHTML = orders.map(function(o) {
      const buyer = o.guestName || (o.buyerId && o.buyerId.name) || "Guest";
      const phone = o.phone || "-";
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "";
      const confirmBtn = o.status === "pending" ? '<button onclick="confirmDirectOrder(\'' + o._id + '\')" style="background:#10B981;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px">Confirm</button>' : "";
      const rejectBtn = o.status === "pending" ? '<button onclick="rejectDirectOrder(\'' + o._id + '\')" style="background:#EF4444;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px">Reject</button>' : "";
      const statusBadge = '<span style="background:' + (sBg[o.status]||"#F3F4F6") + ';color:' + (sColor[o.status]||"#6B7280") + ';padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700">' + (o.status||"pending") + '</span>';
      return "<tr><td>" + (o.reference||"") + "</td><td>" + buyer + "</td><td>" + phone + "</td><td>" + (o.productName||"") + "</td><td>" + (o.quantity||0) + "</td><td>UGX " + Number(o.totalAmount||0).toLocaleString() + "</td><td>" + (o.method||"").replace("_"," ") + "</td><td>" + statusBadge + "</td><td>" + date + "</td><td>" + confirmBtn + rejectBtn + "</td></tr>";
    }).join("");
  } catch(e) { console.error(e); }
}

async function confirmDirectOrder(id) {
  const token = localStorage.getItem("agro_token");
  try {
    await fetch("/api/orders/" + id + "/confirm", { method: "POST", headers: { Authorization: "Bearer " + token } });
    showToast("Order confirmed.");
    loadAndRenderDirectOrders();
  } catch(e) { showToast(e.message, true); }
}

async function rejectDirectOrder(id) {
  const token = localStorage.getItem("agro_token");
  try {
    await fetch("/api/orders/" + id + "/reject", { method: "POST", headers: { Authorization: "Bearer " + token } });
    showToast("Order rejected.");
    loadAndRenderDirectOrders();
  } catch(e) { showToast(e.message, true); }
}

// ==================== GLOBAL EVENTS ====================
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }
});

// ==================== REAL-TIME WIRING ====================
document.addEventListener('DOMContentLoaded', function() {
  if (typeof RT === 'undefined') return;
  RT.connect();

  RT.onNotification(function(notif) {
    // Refresh relevant section if currently visible
    const active = document.querySelector('.content-section.active');
    const activeId = active ? active.id : '';

    if (notif.type === 'new_order' || notif.type === 'order_confirmed' || notif.type === 'order_rejected') {
      if (activeId === 'section-direct-orders') loadAndRenderDirectOrders();
      bumpStatBadge('stat-orders');
    }
    if (notif.type === 'new_payment' || notif.type === 'payment_confirmed' || notif.type === 'payment_rejected') {
      if (activeId === 'section-payments') loadAndRenderPayments();
      bumpStatBadge('stat-payments');
    }
    if (notif.type === 'new_inquiry') {
      if (activeId === 'section-orders') renderOrdersTable();
      bumpStatBadge('stat-inquiries');
    }
  });

  RT.onPriceUpdate(function(prices) {
    if (typeof renderPricesTable === 'function') renderPricesTable();
  });

  RT.onOnlineUpdate(function(userIds) {
    const el = document.getElementById('online-count');
    if (el) el.textContent = userIds.length + ' online';
  });
});

function bumpStatBadge(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transform = 'scale(1.2)';
  el.style.color = '#10B981';
  setTimeout(() => { el.style.transform = ''; el.style.color = ''; }, 800);
}
