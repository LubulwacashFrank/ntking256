require("dotenv").config();

const { getState } = require("./server/data/store");
const { startPriceTicker } = require("./server/services/priceTicker");
const { createApp } = require("./server/app");
const { connectMongo } = require("./server/db/connectMongo");
const { ensureAdminUser } = require("./server/services/adminBootstrap");

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectMongo();
  await ensureAdminUser();

  const state = getState();
  const app = createApp(state);

  startPriceTicker(state);

  app.listen(PORT, () => {
    console.log(`Agro Tech Connect running on http://localhost:${PORT}`);
    console.log("Using unified modular app (server/ + client/).");
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
