import "dotenv/config";
import path from "node:path";

function required(name, value) {
  if (!value || !String(value).trim()) throw new Error(`Missing required environment variable: ${name}`);
  return String(value).trim();
}

const jwtSecret = required("JWT_SECRET", process.env.JWT_SECRET);
if (jwtSecret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");

const port = Number.parseInt(process.env.PORT || "4000", 10);
const maxUploadMb = Number.parseInt(process.env.MAX_UPLOAD_MB || "20", 10);
const aiTimeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS || "120000", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
if (!Number.isInteger(maxUploadMb) || maxUploadMb < 1 || maxUploadMb > 100) throw new Error("MAX_UPLOAD_MB must be between 1 and 100.");

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((v) => v.trim()).filter(Boolean),
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  databaseSsl: (process.env.DATABASE_SSL || "false").toLowerCase() === "true",
  jwtSecret,
  cookieName: process.env.COOKIE_NAME || "campusgpt_session",
  cookieSecure: (process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
  aiServiceUrl: (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, ""),
  aiTimeoutMs,
  sharedDocumentsDir: path.resolve(process.env.SHARED_DOCUMENTS_DIR || "../shared-documents"),
  maxUploadMb
});
