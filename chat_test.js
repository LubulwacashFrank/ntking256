const { io } = require('socket.io-client');

const roomId = ['farmer123','buyer456'].sort().join('_');
let passed = 0, failed = 0;
const log = (ok, msg) => {
  if (ok) { passed++; console.log('  PASS:', msg); }
  else     { failed++; console.log('  FAIL:', msg); }
};

console.log('Connecting farmer and buyer to http://localhost:3000 ...\n');

const farmer = io('http://localhost:3000', {
  auth: { userId: 'farmer123', role: 'farmer', name: 'John Farmer' },
  transports: ['websocket', 'polling']
});
const buyer = io('http://localhost:3000', {
  auth: { userId: 'buyer456', role: 'bulk_buyer', name: 'Mary Buyer' },
  transports: ['websocket', 'polling']
});

farmer.on('connect', () => {
  log(true, 'Farmer connected (id=' + farmer.id + ')');
  farmer.emit('chat:join', { roomId });
});
buyer.on('connect', () => {
  log(true, 'Buyer connected  (id=' + buyer.id + ')');
  buyer.emit('chat:join', { roomId });
});

farmer.on('connect_error', e => log(false, 'Farmer connect error: ' + e.message));
buyer.on('connect_error',  e => log(false, 'Buyer connect error: '  + e.message));

// ── Farmer receives buyer's message ──────────────────────────────
farmer.on('chat:message', msg => {
  if (msg.from === 'buyer456') {
    log(msg.text === 'Hello farmer!',       'Farmer received buyer msg: "' + msg.text + '"');
    log(msg.fromName === 'Mary Buyer',      'Sender name correct: ' + msg.fromName);
    log(msg.roomId === roomId,              'Room ID correct');
    // Farmer replies
    farmer.emit('chat:message', { roomId, text: 'Hi Mary, 500 bags ready!', to: 'buyer456' });
  }
});

// ── Farmer receives typing indicator from buyer ───────────────────
farmer.on('chat:typing', d => {
  log(d.from === 'buyer456', 'Farmer got typing indicator from buyer');
});

// ── Farmer receives notification when buyer messages ─────────────
farmer.on('notification', n => {
  log(n.type === 'message',              'Farmer got notification type=message');
  log(n.title.includes('Mary Buyer'),   'Notification title: "' + n.title + '"');
  log(n.body.includes('Hello farmer!'), 'Notification body: "' + n.body + '"');
});

// ── Buyer receives farmer's reply ────────────────────────────────
buyer.on('chat:message', msg => {
  if (msg.from === 'farmer123') {
    log(msg.text === 'Hi Mary, 500 bags ready!', 'Buyer received farmer reply: "' + msg.text + '"');
    log(msg.fromName === 'John Farmer',           'Farmer name correct: ' + msg.fromName);
  }
});

// ── Buyer receives stop_typing from farmer ───────────────────────
buyer.on('chat:stop_typing', d => {
  log(d.from === 'farmer123', 'Buyer got stop_typing from farmer');
});

// ── Run test sequence ─────────────────────────────────────────────
setTimeout(() => {
  console.log('\n[1] Buyer sends typing indicator...');
  buyer.emit('chat:typing', { roomId, to: 'farmer123' });

  console.log('[2] Buyer sends message to farmer...');
  buyer.emit('chat:message', { roomId, text: 'Hello farmer!', to: 'farmer123' });
}, 1000);

setTimeout(() => {
  console.log('[3] Farmer sends stop_typing...');
  farmer.emit('chat:stop_typing', { roomId });
}, 2200);

setTimeout(() => {
  console.log('\n========================================');
  console.log('  RESULTS: ' + passed + ' passed, ' + failed + ' failed');
  console.log('========================================');
  farmer.disconnect();
  buyer.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}, 4000);
