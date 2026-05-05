/**
 * Emit a notification to a specific user room and/or the admin room.
 * state.io must be set (attached in index.js).
 */
function notify(state, { toUserId, toAdmins = false, type, title, body, data = {} }) {
  if (!state.io) return;
  const payload = { type, title, body, data, time: new Date().toISOString() };
  if (toUserId) state.io.to(`user:${toUserId}`).emit("notification", payload);
  if (toAdmins) state.io.to("admins").emit("notification", payload);
}

module.exports = { notify };
