/**
 * Agro Tech Connect — Real-time Socket Manager
 * Include this script on every page that needs live features.
 * Requires: socket.io client (loaded from /socket.io/socket.io.js)
 */
const RT = (() => {
  let socket = null;
  let _onNotification = null;
  let _onPriceUpdate = null;
  let _onOnlineUpdate = null;
  let _chatHandlers = {};   // roomId -> callback
  let _typingHandlers = {}; // roomId -> callback

  function connect() {
    if (socket && socket.connected) return socket;

    const user = typeof API !== 'undefined' ? API.getUser() : null;
    socket = io({
      auth: user ? { userId: user.id, role: user.role, name: user.name } : {},
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => console.log('[RT] connected', socket.id));
    socket.on('disconnect', () => console.log('[RT] disconnected'));

    // Live price updates
    socket.on('prices:update', (prices) => {
      if (typeof _onPriceUpdate === 'function') _onPriceUpdate(prices);
    });

    // Online users list
    socket.on('online:update', (userIds) => {
      if (typeof _onOnlineUpdate === 'function') _onOnlineUpdate(userIds);
    });

    // Notifications
    socket.on('notification', (notif) => {
      showRTNotification(notif);
      if (typeof _onNotification === 'function') _onNotification(notif);
    });

    // Chat messages
    socket.on('chat:message', (msg) => {
      const handler = _chatHandlers[msg.roomId];
      if (typeof handler === 'function') handler(msg);
    });

    // Typing
    socket.on('chat:typing', (data) => {
      const handler = _typingHandlers[data.roomId || '__global'];
      if (typeof handler === 'function') handler(data);
    });
    socket.on('chat:stop_typing', (data) => {
      const handler = _typingHandlers['stop_' + (data.roomId || '__global')];
      if (typeof handler === 'function') handler(data);
    });

    return socket;
  }

  function joinChat(roomId) {
    if (!socket) connect();
    socket.emit('chat:join', { roomId });
  }

  function sendChatMessage(roomId, text, to) {
    if (!socket) connect();
    socket.emit('chat:message', { roomId, text, to });
  }

  function sendTyping(roomId, to) {
    if (!socket) return;
    socket.emit('chat:typing', { roomId, to });
  }

  function stopTyping(roomId) {
    if (!socket) return;
    socket.emit('chat:stop_typing', { roomId });
  }

  function onChat(roomId, fn) { _chatHandlers[roomId] = fn; }
  function onTyping(roomId, fn) { _typingHandlers[roomId] = fn; }
  function onStopTyping(roomId, fn) { _typingHandlers['stop_' + roomId] = fn; }
  function onNotification(fn) { _onNotification = fn; }
  function onPriceUpdate(fn) { _onPriceUpdate = fn; }
  function onOnlineUpdate(fn) { _onOnlineUpdate = fn; }

  // Build a deterministic room ID from two user IDs
  function roomId(a, b) {
    return [String(a), String(b)].sort().join('_');
  }

  // Show a toast-style notification in the UI
  function showRTNotification(notif) {
    const icons = {
      new_order: '🛒', order_confirmed: '✅', order_rejected: '❌',
      new_payment: '💳', payment_confirmed: '✅', payment_rejected: '❌',
      new_inquiry: '📋', message: '💬'
    };
    const icon = icons[notif.type] || '🔔';
    const container = document.getElementById('rt-notif-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'rt-notif';
    el.innerHTML = `
      <div class="rt-notif-icon">${icon}</div>
      <div class="rt-notif-body">
        <div class="rt-notif-title">${notif.title || 'Notification'}</div>
        <div class="rt-notif-text">${notif.body || ''}</div>
      </div>
      <button class="rt-notif-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(el);
    setTimeout(() => { if (el.parentElement) el.remove(); }, 6000);

    // Also bump notification badge if present
    const dot = document.getElementById('notif-dot') || document.getElementById('rt-notif-dot');
    if (dot) dot.style.display = 'block';
  }

  return { connect, joinChat, sendChatMessage, sendTyping, stopTyping, onChat, onTyping, onStopTyping, onNotification, onPriceUpdate, onOnlineUpdate, roomId };
})();
