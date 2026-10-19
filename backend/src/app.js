import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { asyncHandler } from "./errors.js";
import { requestId } from "./middleware/request-id.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import documentsRouter from "./routes/documents.js";
import conversationsRouter from "./routes/conversations.js";
import chatRouter from "./routes/chat.js";
import usersRouter from "./routes/users.js";
import { isCampusAIHealthy } from "./services/ai-client.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(requestId);
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" }, contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health/live", (_req, res) => res.json({ status: "ok", service: "campusgpt-web-backend" }));
app.get("/api/health", asyncHandler(async (_req, res) => {
  await pool.query("SELECT 1");
  const aiServiceHealthy = await isCampusAIHealthy();
  res.status(200).json({ status: aiServiceHealthy ? "ok" : "degraded", database: "ok", ai_service: aiServiceHealthy ? "ok" : "unavailable" });
}));

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/users", usersRouter);
app.get("/api/account", requireAuth, (req, res) => res.json({ user: req.user }));
app.use(notFound);
app.use(errorHandler);

export default app;
