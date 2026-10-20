const fs = require("fs");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const uploadDirectory = path.resolve(
  process.env.SHARED_DOCUMENTS_DIR || path.join(__dirname, "../../uploads"),
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(uploadDirectory, { recursive: true }, (error) => cb(error, uploadDirectory));
  },
  filename: (_req, file, cb) => {
    const safeBaseName = path
      .basename(file.originalname || "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-150);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeBaseName}`);
  },
});

// Keep the accepted formats aligned with the AI service's supported loaders.
const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter = (_req, file, cb) => {
  if (allowedTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and DOCX files are supported for AI indexing"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
  },
});
