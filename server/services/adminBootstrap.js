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

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await User.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        role: "admin",
        passwordHash
      },
      $setOnInsert: { email: adminEmail }
    },
    { upsert: true }
  );

  console.log(`Bootstrapped admin user: ${adminEmail}`);
}

module.exports = { ensureAdminUser };
