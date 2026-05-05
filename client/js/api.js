const API = {
  async parseError(response, fallbackMessage) {
    try {
      const data = await response.json();
      return data.error || fallbackMessage;
    } catch (e) {
      return fallbackMessage;
    }
  },

  getToken() { return localStorage.getItem("agro_token") || ""; },
  setToken(token) { localStorage.setItem("agro_token", token); },
  clearToken() { localStorage.removeItem("agro_token"); },

  getUser() {
    const token = this.getToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  },

  async register(payload) {
    const r = await fetch("/api/auth/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await this.parseError(r, "Registration failed"));
    return r.json();
  },

  async login(payload) {
    const r = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await this.parseError(r, "Login failed"));
    return r.json();
  },

  async getBootstrap() {
    const r = await fetch("/api/bootstrap");
    if (!r.ok) throw new Error("Failed to load bootstrap data");
    return r.json();
  },

  async getProducts({ q="", district="" } = {}) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (district) p.set("district", district);
    const r = await fetch(`/api/products?${p.toString()}`);
    if (!r.ok) throw new Error("Failed to load products");
    return r.json();
  },

  async getMyProducts() {
    const r = await fetch("/api/products/farmer/my-products", { headers:{ Authorization:`Bearer ${this.getToken()}` } });
    if (r.status === 401) { this.clearToken(); window.location.href="/auth"; throw new Error("Not authenticated"); }
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to load products"));
    return r.json();
  },

  async createProduct(product) {
    const r = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${this.getToken()}`}, body:JSON.stringify(product) });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to create product"));
    return r.json();
  },

  async updateProduct(id, updates) {
    const r = await fetch(`/api/products/${id}`, { method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${this.getToken()}`}, body:JSON.stringify(updates) });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to update product"));
    return r.json();
  },

  async deleteProduct(id) {
    const r = await fetch(`/api/products/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${this.getToken()}` } });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to delete product"));
    return r.json();
  },

  async getLivePrices() {
    const r = await fetch("/api/live-prices");
    if (!r.ok) throw new Error("Failed to load live prices");
    return r.json();
  },

  async sendMessage(payload) {
    const r = await fetch("/api/chat/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to send message"));
    return r.json();
  },

  async submitFeedback(payload) {
    const r = await fetch("/api/feedback", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to submit feedback"));
    return r.json();
  },

  // Used by buyer dashboard and homepage negotiation hub
  async submitInquiry(payload) {
    const headers = { "Content-Type":"application/json" };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch("/api/bulk-inquiries", { method:"POST", headers, body:JSON.stringify(payload) });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to submit inquiry"));
    return r.json();
  },

  // Used by homepage Buy Now button (guest checkout)
  async placeOrder(payload) {
    const r = await fetch("/api/bulk-inquiries", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        product: payload.productName,
        quantity: payload.quantity,
        targetPrice: payload.pricePerUnit,
        location: payload.guestName + " | " + payload.phone,
        notes: "Payment: " + payload.method + (payload.guestEmail ? " | Email: " + payload.guestEmail : "")
      })
    });
    if (!r.ok) throw new Error(await this.parseError(r, "Failed to place order"));
    return r.json();
  },

  // Fetch buyer's own inquiries
  async getInquiries() {
    const headers = {};
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch("/api/bulk-inquiries", { headers });
    if (!r.ok) throw new Error("Failed to load inquiries");
    return r.json();
  },

  // Alias used by buyer dashboard orders tab
  async getOrders() { return this.getInquiries(); }
};
