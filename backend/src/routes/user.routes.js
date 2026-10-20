const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const {
  createUser,
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
} = require("../controllers/user.controller");

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createUser
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  getAllUsers
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  getUserById
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateUser
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  updateUserStatus
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteUser
);

module.exports = router;