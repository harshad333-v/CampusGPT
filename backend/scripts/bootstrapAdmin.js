require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");

async function main() {
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "");
  const name = String(process.env.BOOTSTRAP_ADMIN_NAME || "CampusGPT Administrator").trim();

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Configure backend/.env first.");
  }
  if (!email || !password) {
    throw new Error("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before running this command.");
  }
  if (password.length < 12) {
    throw new Error("Bootstrap administrator password must be at least 12 characters.");
  }
  if (!name) {
    throw new Error("BOOTSTRAP_ADMIN_NAME cannot be empty.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000),
  });

  const existing = await User.findOne({ email }).select("_id role");
  if (existing) {
    throw new Error(
      `An account already exists for ${email} (role: ${existing.role}). No changes were made.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    mustChangePassword: false,
    isActive: true,
  });

  console.log(`Created initial administrator: ${admin.email}`);
  console.log("Keep the credentials private and remove them from the shell environment after use.");
}

main()
  .catch((error) => {
    console.error("Administrator bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
  });
