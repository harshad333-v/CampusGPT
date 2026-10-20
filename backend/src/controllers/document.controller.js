const path = require("path");
const {
  createDocumentService,
  getAllDocumentsService,
  getDocumentByIdService,
  deleteDocumentService,
  updateDocumentService,
  getDocumentFileService,
} = require("../services/document.service");

const createDocument = async (req, res) => {
  try {
    const document = await createDocumentService({
      ...req.body,
      file: req.file,
      uploadedBy: req.user.id,
      uploadedByRole: req.user.role,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const documents =
  await getAllDocumentsService(req.user.id);

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await getDocumentByIdService(
  req.params.id,
  req.user.id
);

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const result = await deleteDocumentService(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await updateDocumentService(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const document = await getDocumentFileService(
  req.params.id,
  req.user.id
);

    return res.download(
      path.resolve(document.filePath),
      document.originalFileName
    );
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
  downloadDocument,
};