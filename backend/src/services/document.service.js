"use strict";

const fs = require("fs");
const Document = require("../models/Document");
const User = require("../models/User");
const {
  indexDocument,
  deleteIndexedDocument,
} = require("./aiClient.service");

function canAccessDocument(user, document) {
  if (!user || !document) return false;
  if (user.role === "admin") return true;
  if (document.visibility === "PUBLIC") return true;
  return document.visibility === "TEACHER_ONLY" && user.role === "teacher";
}

function inferAIDocumentType(document) {
  const name = `${document.title || ""} ${document.originalFileName || ""}`.toLowerCase();

  if (/holiday|raksha|bandhan/.test(name)) return "HOLIDAY_NOTICE";
  if (/independence|orientation|programme|program|event/.test(name)) {
    return "EVENT_NOTICE";
  }

  switch (document.documentType) {
    case "SYLLABUS":
      return "SYLLABUS";
    case "TIMETABLE":
      return "TIMETABLE";
    case "EVENT":
      return "EVENT_NOTICE";
    case "NOTICE":
    case "CIRCULAR":
      return "NOTICE";
    default:
      return document.documentType || "OTHER";
  }
}

async function indexStoredDocument(documentId) {
  const document = await Document.findById(documentId).populate("department", "name code");
  if (!document) throw new Error("Document not found for AI indexing");

  return indexDocument({
    document_id: String(document.aiDocumentId || document._id),
    title: document.title,
    file_path: document.filePath,
    document_type: inferAIDocumentType(document),
    department: document.department?.code || document.department?.name || undefined,
    semester: document.semester || undefined,
    visibility: document.visibility,
    tags: Array.isArray(document.tags) ? document.tags : [],
  });
}

async function createDocumentService({
  title,
  description,
  documentType,
  department,
  semester,
  visibility,
  tags,
  file,
  uploadedBy,
  uploadedByRole,
}) {
  if (!file) throw new Error("Document file is required");

  const normalizedTags = Array.isArray(tags)
    ? tags
    : typeof tags === "string" && tags.trim()
      ? [tags.trim()]
      : [];

  let document;
  try {
    document = await Document.create({
      title,
      description: description || "",
      documentType,
      department,
      semester: semester === "" || semester == null ? null : Number(semester),
      visibility: visibility || "PUBLIC",
      tags: normalizedTags,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy,
      uploadedByRole,
    });
    document.aiDocumentId = String(document._id);
    await document.save();

    await indexStoredDocument(document._id);
  } catch (error) {
    if (document?._id) {
      await Document.findByIdAndDelete(document._id).catch(() => {});
    }
    if (file.path) {
      await fs.promises.rm(file.path, { force: true }).catch(() => {});
    }
    throw error;
  }

  return Document.findById(document._id)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");
}

async function getAllDocumentsService(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User account not found");

  const filter = { isActive: { $ne: false } };
  if (user.role === "student") {
    filter.visibility = "PUBLIC";
  } else if (user.role === "teacher") {
    filter.visibility = { $in: ["PUBLIC", "TEACHER_ONLY"] };
  } else if (user.role !== "admin") {
    return [];
  }

  return Document.find(filter)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code")
    .sort({ createdAt: -1 });
}

async function getDocumentByIdService(id, userId) {
  const user = await User.findById(userId);
  const document = await Document.findById(id)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");

  if (!document) throw new Error("Document not found");
  if (!canAccessDocument(user, document)) throw new Error("Access denied");

  return document;
}

async function deleteDocumentService(id) {
  const document = await Document.findById(id);
  if (!document) throw new Error("Document not found");

  // Fail closed: if AI indexing cannot be reached, keep the metadata and file
  // so the vector index cannot silently drift away from the source of truth.
  await deleteIndexedDocument(String(document.aiDocumentId || document._id));
  if (!document.isSeeded && document.filePath) {
    await fs.promises.rm(document.filePath, { force: true });
  }
  await Document.findByIdAndDelete(id);

  return { message: "Document deleted successfully" };
}

async function updateDocumentService(id, data, user) {
  const document = await Document.findById(id);
  if (!document) throw new Error("Document not found");

  if (user?.role !== "admin" && String(document.uploadedBy) !== String(user?.id)) {
    const error = new Error("You can only update documents you uploaded");
    error.statusCode = 403;
    throw error;
  }

  const editableFields = [
    "title",
    "description",
    "documentType",
    "department",
    "semester",
    "visibility",
    "tags",
  ];
  const previousValues = {};
  for (const field of editableFields) {
    previousValues[field] = document[field];
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      document[field] = data[field];
    }
  }

  await document.save();

  try {
    await indexStoredDocument(document._id);
  } catch (error) {
    for (const field of editableFields) {
      document[field] = previousValues[field];
    }
    await document.save();

    // Best-effort restoration of the previous vector metadata/content.
    try {
      await indexStoredDocument(document._id);
    } catch {
      // Keep the original AI indexing error for the caller.
    }
    throw error;
  }

  return Document.findById(document._id)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");
}

async function getDocumentFileService(id, userId) {
  const user = await User.findById(userId);
  const document = await Document.findById(id);
  if (!document) throw new Error("Document not found");
  if (!canAccessDocument(user, document)) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }
  return document;
}

module.exports = {
  createDocumentService,
  getAllDocumentsService,
  getDocumentByIdService,
  updateDocumentService,
  deleteDocumentService,
  getDocumentFileService,
  canAccessDocument,
  inferAIDocumentType,
  indexStoredDocument,
};
