import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { HttpError, asyncHandler } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { getAccessibleDocumentIds } from "../services/document-access.js";
import { canInvokeAiWithDocumentScope, normalizeAccessibleDocumentIds } from "../services/ai-access-policy.js";
import { askCampusAI } from "../services/ai-client.js";

const router = Router();
const chatLimiterMessage = "Please send a message.";
const chatRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.user.id,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "You have sent too many chat requests. Please wait a few minutes." } }
});

const chatSchema = z.object({
  message: z.string().trim().min(1, chatLimiterMessage).max(4000),
  conversationId: z.string().uuid().optional().nullable()
});

router.post("/", requireAuth, chatRateLimiter, asyncHandler(async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || "Invalid chat request.", "VALIDATION_ERROR");
  }

  const message = parsed.data.message;
  let conversationId = parsed.data.conversationId || null;

  if (conversationId) {
    const existing = await pool.query(
      "SELECT id FROM campus_app.conversations WHERE id = $1 AND user_id = $2",
      [conversationId, req.user.id]
    );
    if (!existing.rows[0]) throw new HttpError(404, "Conversation not found.", "CONVERSATION_NOT_FOUND");
  } else {
    const created = await pool.query(
      `INSERT INTO campus_app.conversations (user_id, title)
       VALUES ($1, $2) RETURNING id`,
      [req.user.id, message.length > 72 ? `${message.slice(0, 69)}...` : message]
    );
    conversationId = created.rows[0].id;
  }

  const { rows: historyRows } = await pool.query(
    `SELECT role, content
       FROM (
         SELECT role, content, created_at
           FROM campus_app.messages
          WHERE conversation_id = $1
          ORDER BY created_at DESC
          LIMIT 12
       ) recent
      ORDER BY created_at ASC`,
    [conversationId]
  );

  const accessibleDocumentIds = normalizeAccessibleDocumentIds(
    await getAccessibleDocumentIds(req.user)
  );
  let result;

  // The AI service interprets an empty ID list as "no access filter".
  // Never forward an empty list, because that would bypass the web backend's ACL decision.
  if (!canInvokeAiWithDocumentScope(accessibleDocumentIds)) {
    result = {
      answer: "No indexed college documents are available to your account yet.",
      sources: [],
      query_type: "UNSUPPORTED",
      grounded: false
    };
  } else {
    result = await askCampusAI({
      message,
      conversation: historyRows,
      userContext: { role: req.user.role },
      accessibleDocumentIds
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO campus_app.messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, message]
    );
    const assistant = await client.query(
      `INSERT INTO campus_app.messages
         (conversation_id, role, content, sources, grounded, query_type)
       VALUES ($1, 'assistant', $2, $3::jsonb, $4, $5)
       RETURNING id, created_at`,
      [
        conversationId,
        result.answer,
        JSON.stringify(result.sources || []),
        Boolean(result.grounded),
        result.query_type
      ]
    );
    await client.query(
      "UPDATE campus_app.conversations SET updated_at = now() WHERE id = $1",
      [conversationId]
    );
    await client.query("COMMIT");

    res.json({
      conversationId,
      answer: result.answer,
      sources: result.sources || [],
      query_type: result.query_type,
      grounded: Boolean(result.grounded),
      messageId: assistant.rows[0].id,
      createdAt: assistant.rows[0].created_at
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

export default router;
