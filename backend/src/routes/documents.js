import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { HttpError, asyncHandler } from "../errors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getDocumentVisibleToUser,
  serializeDocument
} from "../services/document-access.js";
import { deleteFromCampusAI, ingestWithCampusAI } from "../services/ai-client.js";

const router = Router();
const acceptedTypes = new Set(["NOTICE", "EVENT_NOTICE", "HOLIDAY_NOTICE", "SYLLABUS", "TIMETABLE", "GENERAL"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (![".pdf", ".docx"].includes(extension)) {
      return callback(new HttpError(400, "Only PDF and DOCX documents are supported.", "FILE_TYPE_NOT_SUPPORTED"));
    }
    callback(null, true);
  }
});

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(200),
  documentType: z.string().trim().optional(),
  department: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(20).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  tags: z.string().max(1000).optional()
});

function asPublicDocument(row) {
  return serializeDocument(row);
}

async function sendForIngestion(row) {
  return ingestWithCampusAI({
    document_id: row.document_id,
    title: row.title,
    file_path: row.storage_path,
    document_type: row.document_type,
    department: row.department,
    semester: row.semester,
    visibility: row.visibility,
    tags: row.tags || []
  });
}

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT d.*
       FROM campus_app.documents d
       LEFT JOIN campus_app.document_access da
         ON da.document_id = d.document_id AND da.user_id = $1
      WHERE $2::text = 'admin'
         OR d.visibility = 'PUBLIC'
         OR d.owner_user_id = $1
         OR da.user_id IS NOT NULL
      ORDER BY d.created_at DESC`,
    [req.user.id, req.user.role]
  );

  res.json({ documents: rows.map(asPublicDocument) });
}));

router.post("/upload", requireAuth, requireRole("staff", "admin"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "Choose a PDF or DOCX file to upload.", "FILE_REQUIRED");

  const parsed = metadataSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || "Invalid document metadata.", "VALIDATION_ERROR");
  }

  const extension = path.extname(req.file.originalname).toLowerCase();
  const documentId = `doc-${randomUUID()}`;
  const safeOriginalName = path.basename(req.file.originalname).replace(/[\r\n"]/g, "_").slice(0, 255);
  const storagePath = path.join(config.sharedDocumentsDir, `${documentId}${extension}`);
  const documentType = parsed.data.documentType || "GENERAL";

  if (!acceptedTypes.has(documentType)) {
    throw new HttpError(400, "Unsupported document type.", "INVALID_DOCUMENT_TYPE");
  }

  // Publishing is reserved to admins; staff uploads default to PRIVATE.
  const visibility = req.user.role === "admin" ? (parsed.data.visibility || "PRIVATE") : "PRIVATE";
  const tags = (parsed.data.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);

  await fs.mkdir(config.sharedDocumentsDir, { recursive: true });
  await fs.writeFile(storagePath, req.file.buffer, { flag: "wx" });

  let row;
  try {
    const result = await pool.query(
      `INSERT INTO campus_app.documents
         (document_id, owner_user_id, title, original_filename, storage_path,
          document_type, department, semester, visibility, ingest_status, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'processing', $10)
       RETURNING *`,
      [
        documentId,
        req.user.id,
        parsed.data.title,
        safeOriginalName,
        storagePath,
        documentType,
        parsed.data.department || null,
        parsed.data.semester || null,
        visibility,
        tags
      ]
    );
    row = result.rows[0];
  } catch (error) {
    await fs.rm(storagePath, { force: true });
    throw error;
  }

  try {
    const ingestion = await sendForIngestion(row);
    const updated = await pool.query(
      `UPDATE campus_app.documents
          SET ingest_status = 'ready', chunks_count = $2, error_message = NULL, updated_at = now()
        WHERE document_id = $1
        RETURNING *`,
      [documentId, ingestion.chunks_created]
    );
    res.status(201).json({ document: asPublicDocument(updated.rows[0]) });
  } catch (error) {
    await pool.query(
      `UPDATE campus_app.documents
          SET ingest_status = 'failed', error_message = $2, updated_at = now()
        WHERE document_id = $1`,
      [documentId, error.message.slice(0, 500)]
    );
    throw new HttpError(502, "The file was saved but indexing failed. Check the AI service and retry indexing.", "INGESTION_FAILED");
  }
}));

router.post("/:documentId/access", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = z.object({ userId: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "A valid userId is required.", "VALIDATION_ERROR");

  const document = await pool.query(
    "SELECT document_id FROM campus_app.documents WHERE document_id = $1",
    [req.params.documentId]
  );
  if (!document.rows[0]) throw new HttpError(404, "Document not found.", "DOCUMENT_NOT_FOUND");

  const user = await pool.query(
    "SELECT id FROM campus_app.users WHERE id = $1 AND is_active = true",
    [parsed.data.userId]
  );
  if (!user.rows[0]) throw new HttpError(404, "Active user not found.", "USER_NOT_FOUND");

  await pool.query(
    `INSERT INTO campus_app.document_access (document_id, user_id, granted_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (document_id, user_id) DO NOTHING`,
    [req.params.documentId, parsed.data.userId, req.user.id]
  );
  res.status(201).json({ success: true, document_id: req.params.documentId, user_id: parsed.data.userId });
}));

router.delete("/:documentId/access/:userId", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM campus_app.document_access WHERE document_id = $1 AND user_id = $2",
    [req.params.documentId, req.params.userId]
  );
  res.json({ success: true, removed: result.rowCount > 0 });
}));

router.post("/:documentId/reindex", requireAuth, requireRole("staff", "admin"), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM campus_app.documents WHERE document_id = $1",
    [req.params.documentId]
  );
  const row = rows[0];
  if (!row) throw new HttpError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
  if (req.user.role !== "admin" && row.owner_user_id !== req.user.id) {
    throw new HttpError(403, "You cannot reindex this document.", "FORBIDDEN");
  }
  if (!row.storage_path) {
    throw new HttpError(409, "This document was registered from the existing index and has no uploaded source file to reindex.", "SOURCE_FILE_UNAVAILABLE");
  }

  await pool.query(
    "UPDATE campus_app.documents SET ingest_status = 'processing', error_message = NULL, updated_at = now() WHERE document_id = $1",
    [row.document_id]
  );
  try {
    const result = await sendForIngestion(row);
    const updated = await pool.query(
      `UPDATE campus_app.documents SET ingest_status='ready', chunks_count=$2, error_message=NULL, updated_at=now()
       WHERE document_id=$1 RETURNING *`,
      [row.document_id, result.chunks_created]
    );
    res.json({ document: asPublicDocument(updated.rows[0]) });
  } catch (error) {
    await pool.query(
      `UPDATE campus_app.documents
          SET ingest_status = 'failed', error_message = 'Reindexing failed; inspect AI service logs.', updated_at = now() WHERE document_id = $1",
      [row.document_id]
    );
    throw new HttpError(502, "Document reindexing failed. Inspect the AI service logs and retry.", "REINDEX_FAILED");
  }
}));

router.get("/:documentId/download", requireAuth, asyncHandler(async (req, res) => {
  const row = await getDocumentVisibleToUser(req.params.documentId, req.user);
  if (!row) throw new HttpError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
  if (!row.storage_path) throw new HttpError(404, "The original source file is not available through the web backend.", "SOURCE_FILE_UNAVAILABLE");

  await fs.access(row.storage_path).catch(() => {
    throw new HttpError(404, "The original source file is unavailable.", "SOURCE_FILE_UNAVAILABLE");
  });
  res.download(row.storage_path, row.original_filename);
}));

router.delete("/:documentId", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM campus_app.documents WHERE document_id = $1",
    [req.params.documentId]
  );
  const row = rows[0];
  if (!row) throw new HttpError(404, "Document not found.", "DOCUMENT_NOT_FOUND");
  if (req.user.role !== "admin" && row.owner_user_id !== req.user.id) {
    throw new HttpError(403, "Only the owner or an administrator can delete this document.", "FORBIDDEN");
  }

  await deleteFromCampusAI(row.document_id);
  await pool.query("DELETE FROM campus_app.documents WHERE document_id = $1", [row.document_id]);
  if (row.storage_path) await fs.rm(row.storage_path, { force: true }).catch(() => {});

  res.json({ success: true, document_id: row.document_id });
}));

export default router;
