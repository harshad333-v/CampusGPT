import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.join(here, "migrations");

try {
  const names = (await fs.readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of names) {
    const sql = await fs.readFile(path.join(migrationDir, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`Migration applied: ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Migration failed: ${name}: ${error.message}`);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
