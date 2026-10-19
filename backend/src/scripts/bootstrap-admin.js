import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "CampusGPT Administrator";

if (!email || !password) {
  console.error("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in backend/.env first.");
  process.exitCode = 1;
} else if (Buffer.byteLength(password, "utf8") < 10 || Buffer.byteLength(password, "utf8") > 72) {
  console.error("Bootstrap password must be between 10 and 72 UTF-8 bytes.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO campus_app.users (email, full_name, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = now()
       RETURNING id, email, full_name, role`,
      [email, fullName, passwordHash]
    );
    console.log(`Administrator account ready: ${rows[0].email}`);
    console.log("For an existing account, this command promotes the account but does not reset its password.");
  } catch (error) {
    console.error("Could not create administrator account:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
