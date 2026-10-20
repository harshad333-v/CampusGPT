const express = require("express");

const router = express.Router();

const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
} = require("../controllers/department.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const {
  authorize,
} = require("../middleware/role.middleware");

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createDepartment
);

router.get(
  "/",
  authenticate,
  getAllDepartments
);

router.get(
  "/:id",
  authenticate,
  getDepartmentById
);

module.exports = router;