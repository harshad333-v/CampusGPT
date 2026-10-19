import app from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";

const server = app.listen(config.port, "0.0.0.0", async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`CampusGPT web backend listening on port ${config.port}`);
  } catch (error) {
    console.error("Database connection check failed:", error.message);
    server.close(() => process.exit(1));
  }
});

server.requestTimeout = config.aiTimeoutMs + 15000;
server.headersTimeout = server.requestTimeout + 5000;

function shutdown(signal) {
  console.log(`Received ${signal}; shutting down.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
