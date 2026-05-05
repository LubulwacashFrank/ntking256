// Runtime-only state — no hardcoded data.
// All persistent data lives in MongoDB.
const state = {
  io: null,
  onlineUsers: null
};

function getState() {
  return state;
}

module.exports = { getState };
