const fs = require("fs");
const Document = require("../models/Document");
const User = require("../models/User");

const canAccessDocument = (user, document) => {
  if (user.role === "admin") {
    return true;
  }

  if (document.visibility === "PUBLIC") {
    return true;
  }

  if (
    document.visibility === "TEACHER_ONLY" &&
    user.role === "teacher"
  ) {
    return true;
  }

  return false;
};

const createDocumentService = async ({
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
}) => {
  if (!file) {
    throw new Error("Document file is required");
  }

  const document = await Document.create({
    title,
    description,
    documentType,
    department,
    semester: semester || null,
    visibility: visibility || "PUBLIC",
    tags: tags || [],
    fileName: file.filename,
    originalFileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy,
    uploadedByRole,
  });

  return await Document.findById(document._id)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");
};

const getAllDocumentsService = async (userId) => {
  const user = await User.findById(userId);

  let filter = {};

  if (user.role === "student") {
    filter = {
      visibility: "PUBLIC",
    };
  }

  if (user.role === "teacher") {
    filter = {
      visibility: {
        $in: ["PUBLIC", "TEACHER_ONLY"],
      },
    };
  }

  if (user.role === "admin") {
    filter = {};
  }

  return await Document.find(filter)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code")
    .sort({ createdAt: -1 });
};

const getDocumentByIdService = async (
  id,
  userId
) => {
  const user = await User.findById(userId);

  const document = await Document.findById(id)
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");

  if (!document) {
    throw new Error("Document not found");
  }

  if (!canAccessDocument(user, document)) {
    throw new Error("Access denied");
  }

  return document;
};

const deleteDocumentService = async (id) => {
  const document = await Document.findById(id);

  if (!document) {
    throw new Error("Document not found");
  }

  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  await Document.findByIdAndDelete(id);

  return {
    message: "Document deleted successfully",
  };
};

const updateDocumentService = async (id, data) => {
  const document = await Document.findByIdAndUpdate(
    id,
    data,
    {
      returnDocument: "after",
      runValidators: true,
    }
  )
    .populate("uploadedBy", "name email role")
    .populate("department", "name code");

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};

const getDocumentFileService = async (
  id,
  userId
) => {
  const user = await User.findById(userId);

  const document = await Document.findById(id);

  if (!document) {
    throw new Error("Document not found");
  }

  if (!canAccessDocument(user, document)) {
    throw new Error("Access denied");
  }

  return document;
};

module.exports = {
  createDocumentService,
  getAllDocumentsService,
  getDocumentByIdService,
  updateDocumentService,
  deleteDocumentService,
  getDocumentFileService,
};