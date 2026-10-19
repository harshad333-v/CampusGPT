import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { HttpError, asyncHandler } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Please wait and try again." } }
});

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(10).refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must be 72 UTF-8 bytes or shorter."
  })
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72)
});

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at
  };
}

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: "7d",
    issuer: "campusgpt-backend",
    audience: "campusgpt-web"
  });

  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure || config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure || config.nodeEnv === "production",
    sameSite: "lax",
    path: "/"
  });
}

router.post("/register", authLimiter, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || "Invalid registration details.", "VALIDATION_ERROR");
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  let result;
  try {
    result = await pool.query(
      `INSERT INTO campus_app.users (email, full_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role, created_at`,
      [email, parsed.data.fullName, passwordHash]
    );
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "An account with this email already exists.", "EMAIL_EXISTS");
    }
    throw error;
  }

  const user = result.rows[0];
  setSessionCookie(res, user.id);
  res.status(201).json({ user: publicUser(user) });
}));

router.post("/login", authLimiter, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Enter a valid email and password.", "VALIDATION_ERROR");
  }

  const { rows } = await pool.query(
    `SELECT id, email, full_name, password_hash, role, is_active, created_at
       FROM campus_app.users
      WHERE lower(email) = lower($1)
      LIMIT 1`,
    [parsed.data.email]
  );

  const user = rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  }

  setSessionCookie(res, user.id);
  res.json({ user: publicUser(user) });
}));

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, role, created_at
       FROM campus_app.users WHERE id = $1`,
    [req.user.id]
  );
  if (!rows[0]) throw new HttpError(401, "Please sign in again.", "AUTH_REQUIRED");
  res.json({ user: publicUser(rows[0]) });
}));

export default router;
