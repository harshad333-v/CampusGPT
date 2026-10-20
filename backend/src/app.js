const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGIN ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      // Native clients and same-origin proxy requests may not send Origin.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));

// Uploaded files are served only through authenticated/authorized download routes.
// Do not publish the shared upload directory as an unauthenticated static path.

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const documentRoutes = require("./routes/document.routes");
const notificationRoutes = require("./routes/notification.routes");
const departmentRoutes = require("./routes/department.routes");
const chatRoutes = require("./routes/chat.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const bulkRegistrationRoutes = require("./routes/bulkRegistration.routes");

app.get("/api/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "degraded",
    service: "campusgpt-backend",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/users", bulkRegistrationRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({ message: "CampusGPT Backend Running" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Multer and CORS failures are returned as JSON rather than Express HTML pages.
app.use((error, _req, res, _next) => {
  const status = error.statusCode || (error.name === "MulterError" ? 400 : 500);
  res.status(status).json({
    success: false,
    message: status >= 500 ? "The request could not be completed." : error.message,
  });
});

module.exports = app;
