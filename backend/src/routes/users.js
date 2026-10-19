import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { HttpError, asyncHandler } from "../errors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const roleSchema = z.object({
  role: z.enum(["student", "staff"])
});

router.get("/", requireAuth, requireRole("admin"), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at
       FROM campus_app.users
      ORDER BY created_at DESC
      LIMIT 500`
  );
  res.json({
    users: rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at
    }))
  });
}));

router.patch("/:userId/role", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Role must be student or staff. Additional administrators must be created through the approved admin bootstrap process.", "INVALID_ROLE");
  }
  if (req.params.userId === req.user.id) {
    throw new HttpError(409, "You cannot change your own role from this screen.", "SELF_ROLE_CHANGE_NOT_ALLOWED");
  }

  const { rows } = await pool.query(
    `UPDATE campus_app.users
        SET role = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, email, full_name, role, is_active, created_at`,
    [req.params.userId, parsed.data.role]
  );
  const row = rows[0];
  if (!row) throw new HttpError(404, "User not found.", "USER_NOT_FOUND");

  res.json({
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at
    }
  });
}));

export default router;
