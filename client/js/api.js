const API = {
  async parseError(response, fallbackMessage) {
    try {
      const data = await response.json();
      return data.error || fallbackMessage;
    } catch (error) {
      return fallbackMessage;
    }
  },

  getToken() {
    return localStorage.getItem("agro_token") || "";
  },

  setToken(token) {
    localStorage.setItem("agro_token", token);
  },

  clearToken() {
    localStorage.removeItem("agro_token");
  },

  // Decode JWT to get user info
  getUser() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (e) {
      return null;
    }
  },

  async register(payload) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await this.parseError(response, "Registration failed"));
    }
    return response.json();
  },

  async login(payload) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await this.parseError(response, "Login failed"));
    }
    return response.json();
  },

  async getBootstrap() {
    const response = await fetch("/api/bootstrap");
    if (!response.ok) throw new Error("Failed to load bootstrap data");
    return response.json();
  },

  async getProducts({ q = "", district = "" } = {}) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (district) params.set("district", district);
    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to load products");
    return response.json();
  },

  async getMyProducts() {
    const response = await fetch("/api/products/farmer/my-products", {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (response.status === 401) {
      this.clearToken();
      window.location.href = "/auth";
      throw new Error("Not authenticated");
    }
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to load products"));
    return response.json();
  },

  async createProduct(product) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to create product"));
    return response.json();
  },

  async updateProduct(id, updates) {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to update product"));
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to delete product"));
    return response.json();
  },

  async getLivePrices() {
    const response = await fetch("/api/live-prices");
    if (!response.ok) throw new Error("Failed to load live prices");
    return response.json();
  },

  async sendMessage(payload) {
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to send message"));
    return response.json();
  },

  async submitFeedback(payload) {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to submit feedback"));
    return response.json();
  },

  async submitInquiry(payload) {
    const response = await fetch("/api/bulk-inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to submit inquiry"));
    return response.json();
  },

  async placeOrder(payload) {
    const response = await fetch("/api/bulk-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: payload.productName,
        quantity: payload.quantity,
        targetPrice: payload.pricePerUnit,
        location: payload.guestName + " | " + payload.phone,
        notes: "Payment: " + payload.method + (payload.guestEmail ? " | Email: " + payload.guestEmail : "")
      })
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to place order"));
    return response.json();
  },

  async getInquiries() {
    const response = await fetch("/api/bulk-inquiries", {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to load inquiries");
    return response.json();
  },

  async initiatePayment(payload) {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.getToken()}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Payment failed"));
    return response.json();
  },

  async getPayments() {
    const response = await fetch("/api/payments", {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to load payments");
    return response.json();
  },

  async confirmPayment(id) {
    const response = await fetch(`/api/payments/${id}/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to confirm payment"));
    return response.json();
  },

  async rejectPayment(id) {
    const response = await fetch(`/api/payments/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to reject payment"));
    return response.json();
  },

  async getReviews(productId) {
    const url = productId ? `/api/reviews?productId=${productId}` : '/api/reviews';
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load reviews");
    return response.json();
  },

  async submitReview(payload) {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.getToken()}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to submit review"));
    return response.json();
  },

  async getAllReviews() {
    const response = await fetch("/api/reviews/all", {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to load reviews");
    return response.json();
  },

  async deleteReview(id) {
    const response = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to delete review");
    return response.json();
  },

  async placeOrder(payload) {
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch("/api/orders", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await this.parseError(response, "Failed to place order"));
    return response.json();
  },

  async getOrders() {
    const response = await fetch("/api/orders", {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to load orders");
    return response.json();
  },

  async confirmOrder(id) {
    const response = await fetch(`/api/orders/${id}/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to confirm order");
    return response.json();
  },

  async rejectOrder(id) {
    const response = await fetch(`/api/orders/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to reject order");
    return response.json();
  }
};
