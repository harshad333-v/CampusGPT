const express = require("express");

const router = express.Router();

const {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
deleteNotification,
} = require("../controllers/notification.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const {
  authorize,
} = require("../middleware/role.middleware");

router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  createNotification
);

router.get(
  "/",
  authenticate,
  getAllNotifications
);

router.get(
  "/:id",
  authenticate,
  getNotificationById
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "teacher"),
  updateNotification
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteNotification
);

module.exports = router;