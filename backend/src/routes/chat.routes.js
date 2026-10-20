const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");

const {
  createSession,
  getUserSessions,
  getSessionMessages,
  sendMessage,
  renameSession,
  deleteSession,
} = require("../controllers/chat.controller");

router.post(
  "/sessions",
  authenticate,
  createSession
);

router.get(
  "/sessions",
  authenticate,
  getUserSessions
);

router.get(
  "/sessions/:id/messages",
  authenticate,
  getSessionMessages
);

router.post(
  "/sessions/:id/messages",
  authenticate,
  sendMessage
);

router.put(
  "/sessions/:id/title",
  authenticate,
  renameSession
);

router.delete(
  "/sessions/:id",
  authenticate,
  deleteSession
);

module.exports = router;