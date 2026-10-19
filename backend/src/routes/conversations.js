import { Router } from "express";
import { pool } from "../db/pool.js";
import { HttpError, asyncHandler } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.created_at, c.updated_at,
            COUNT(m.id)::int AS message_count
       FROM campus_app.conversations c
       LEFT JOIN campus_app.messages m ON m.conversation_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT 100`,
    [req.user.id]
  );
  res.json({ conversations: rows });
}));

router.get("/:conversationId/messages", requireAuth, asyncHandler(async (req, res) => {
  const { rows: ownership } = await pool.query(
    "SELECT id FROM campus_app.conversations WHERE id = $1 AND user_id = $2",
    [req.params.conversationId, req.user.id]
  );
  if (!ownership[0]) throw new HttpError(404, "Conversation not found.", "CONVERSATION_NOT_FOUND");

  const { rows } = await pool.query(
    `SELECT id, role, content, sources, grounded, query_type, created_at
       FROM campus_app.messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT 500`,
    [req.params.conversationId]
  );
  res.json({ messages: rows });
}));

router.delete("/:conversationId", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM campus_app.conversations WHERE id = $1 AND user_id = $2",
    [req.params.conversationId, req.user.id]
  );
  if (result.rowCount === 0) throw new HttpError(404, "Conversation not found.", "CONVERSATION_NOT_FOUND");
  res.status(204).end();
}));

export default router;
