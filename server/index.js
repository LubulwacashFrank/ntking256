require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const { getState } = require("./data/store");
const { startPriceTicker } = require("./services/priceTicker");
const { createApp } = require("./app");
const { connectMongo } = require("./db/connectMongo");
const { ensureAdminUser } = require("./services/adminBootstrap");

const PORT = process.env.PORT || 3000;

// Track online users: userId -> socketId
const onlineUsers = new Map();

async function startServer() {
  await connectMongo();
  await ensureAdminUser();

  const state = getState();
  const app = createApp(state);

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"]
  });

  // Attach io to state so routes can emit events
  state.io = io;
  state.onlineUsers = onlineUsers;

  io.on("connection", (socket) => {
    // ── Auth: client sends token on connect
    const userId = socket.handshake.auth.userId;
    const role   = socket.handshake.auth.role;
    const name   = socket.handshake.auth.name || "User";

    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.userRole = role;
      socket.userName = name;
      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);
      // Admins join admin room
      if (role === "admin") socket.join("admins");
      // Broadcast updated online list
      io.emit("online:update", Array.from(onlineUsers.keys()));
    }

    // ── Direct chat: join a room between two users
    socket.on("chat:join", ({ roomId }) => {
      socket.join(`chat:${roomId}`);
    });

    // ── Direct chat: send message to room
    socket.on("chat:message", ({ roomId, text, to }) => {
      if (!text || !roomId) return;
      const msg = {
        from: userId,
        fromName: name,
        text: String(text).trim(),
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        roomId
      };
      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(`chat:${roomId}`).emit("chat:message", msg);
      // Also push notification to recipient if not in room
      if (to) {
        io.to(`user:${to}`).emit("notification", {
          type: "message",
          title: `New message from ${name}`,
          body: text.substring(0, 60),
          roomId
        });
      }
    });

    // ── Typing indicator
    socket.on("chat:typing", ({ roomId, to }) => {
      socket.to(`chat:${roomId}`).emit("chat:typing", { from: userId, fromName: name });
    });

    socket.on("chat:stop_typing", ({ roomId }) => {
      socket.to(`chat:${roomId}`).emit("chat:stop_typing", { from: userId });
    });

    // ── Disconnect
    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("online:update", Array.from(onlineUsers.keys()));
      }
    });
  });

  // Patch priceTicker to emit via socket instead of just updating state
  startPriceTicker(state, (updatedPrices) => {
    io.emit("prices:update", updatedPrices);
  });

  httpServer.listen(PORT, () => {
    console.log(`Agro Tech Connect running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
