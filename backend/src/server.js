require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");

const PORT = Number(process.env.PORT || 4000);

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.startsWith("REPLACE_WITH")) {
    throw new Error(
      "Set JWT_SECRET to a random secret of at least 32 characters in backend/.env.",
    );
  }

  await connectDB();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusGPT backend listening on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; shutting down backend`);
    server.close(() => {
      const mongoose = require("mongoose");
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("CampusGPT backend failed to start:", error.message);
  process.exit(1);
});
