import { pool } from "../db/pool.js";

try {
  const tables = await pool.query("SELECT to_regclass('campusgpt.langchain_pg_embedding') AS embeddings, to_regclass('campusgpt.langchain_pg_collection') AS collections");
  if (!tables.rows[0]?.embeddings || !tables.rows[0]?.collections) {
    throw new Error("Supabase vector tables were not found. Configure the AI service first.");
  }

  const { rows } = await pool.query(
    "SELECT e.cmetadata ->> 'document_id' AS document_id, " +
    "min(e.cmetadata ->> 'title') AS title, min(e.cmetadata ->> 'file_name') AS file_name, " +
    "min(e.cmetadata ->> 'document_type') AS document_type, count(*)::int AS chunks " +
    "FROM campusgpt.langchain_pg_embedding e " +
    "JOIN campusgpt.langchain_pg_collection c ON c.uuid = e.collection_id " +
    "WHERE c.name = 'campusgpt' AND e.cmetadata ->> 'document_id' IS NOT NULL " +
    "GROUP BY e.cmetadata ->> 'document_id' ORDER BY document_id"
  );
  if (!rows.length) throw new Error("No indexed CampusGPT documents found. Ingest PDFs first.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      const documentId = row.document_id;
      const filename = row.file_name || (documentId + ".pdf");
      const title = row.title || filename.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
      const type = row.document_type || "GENERAL";
      const tags = [type.toLowerCase()];
      await client.query(
        "INSERT INTO campus_app.documents " +
        "(document_id, owner_user_id, title, original_filename, storage_path, document_type, visibility, ingest_status, chunks_count, tags) " +
        "VALUES ($1, NULL, $2, $3, NULL, $4, 'PUBLIC', 'ready', $5, $6) " +
        "ON CONFLICT (document_id) DO UPDATE SET " +
        "title = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.title ELSE campus_app.documents.title END, " +
        "document_type = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.document_type ELSE campus_app.documents.document_type END, " +
        "visibility = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.visibility ELSE campus_app.documents.visibility END, " +
        "ingest_status = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.ingest_status ELSE campus_app.documents.ingest_status END, " +
        "chunks_count = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.chunks_count ELSE campus_app.documents.chunks_count END, " +
        "tags = CASE WHEN campus_app.documents.owner_user_id IS NULL THEN EXCLUDED.tags ELSE campus_app.documents.tags END, updated_at = now()",
        [documentId, title, filename, type, row.chunks, tags]
      );
    }
    await client.query("COMMIT");
    console.log("Registered " + rows.length + " existing vector-indexed document groups (metadata only; no re-embedding).");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error("Existing-document registration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}