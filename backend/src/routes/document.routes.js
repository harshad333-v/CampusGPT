const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
  downloadDocument,
} = require("../controllers/document.controller");

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  upload.single("file"),
  createDocument
);

router.get(
  "/",
  authenticate,
  getAllDocuments
);

router.get(
  "/download/:id",
  authenticate,
  downloadDocument
);

router.get(
  "/:id",
  authenticate,
  getDocumentById
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteDocument
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  updateDocument
);



module.exports = router;