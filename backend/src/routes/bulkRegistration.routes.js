const express = require("express");

const router = express.Router();

const upload = require("../middleware/bulkUserUpload");
const { authenticate } = require("../middleware/auth.middleware");

const {
  bulkRegisterUsers,
} = require("../controllers/bulkRegistration.controller");

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

router.post(
  "/bulk",
  authenticate,
  adminOnly,
  upload.single("file"),
  bulkRegisterUsers
);

module.exports = router;