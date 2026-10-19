import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { HttpError, asyncHandler } from "../errors.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[config.cookieName];
  if (!token) {
    throw new HttpError(401, "Please sign in to continue.", "AUTH_REQUIRED");
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, {
      issuer: "campusgpt-backend",
      audience: "campusgpt-web"
    });
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.", "SESSION_INVALID");
  }

  const { rows } = await pool.query(
    `SELECT id, email, full_name, role, is_active
       FROM campus_app.users
      WHERE id = $1`,
    [payload.sub]
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    throw new HttpError(401, "This account is not active.", "ACCOUNT_INACTIVE");
  }

  req.user = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role
  };
  next();
});

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
    }
    next();
  };
}
