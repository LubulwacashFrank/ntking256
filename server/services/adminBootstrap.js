const bcrypt = require("bcryptjs");
const { User } = require("../models/User");

async function ensureAdminUser() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "System Admin";

  if (!adminEmail || !adminPassword) {
    console.log("Admin bootstrap skipped (ADMIN_EMAIL or ADMIN_PASSWORD missing).");
    return;
  }

  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    // Only fix role if wrong, never overwrite password
    if (existing.role !== 'admin') {
      await User.updateOne({ email: adminEmail }, { $set: { role: 'admin' } });
    }
    console.log(`Admin user exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await User.create({ name: adminName, email: adminEmail, passwordHash, role: 'admin', isVerified: true });
  console.log(`Created admin user: ${adminEmail}`);
}

module.exports = { ensureAdminUser };
