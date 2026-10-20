const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Enable CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const documentRoutes = require("./routes/document.routes");
const notificationRoutes = require("./routes/notification.routes");
const departmentRoutes = require("./routes/department.routes");
const chatRoutes = require("./routes/chat.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const bulkRegistrationRoutes = require("./routes/bulkRegistration.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/users", bulkRegistrationRoutes);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "CampusGPT Backend Running",
  });
});

// Catch-all for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

module.exports = app;