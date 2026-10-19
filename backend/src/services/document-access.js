import { pool } from "../db/pool.js";

export async function getAccessibleDocumentIds(user) {
  const { rows } = await pool.query(
    `SELECT DISTINCT d.document_id
       FROM campus_app.documents d
       LEFT JOIN campus_app.document_access da
         ON da.document_id = d.document_id AND da.user_id = $1
      WHERE d.ingest_status = 'ready'
        AND (
          $2::text = 'admin'
          OR d.visibility = 'PUBLIC'
          OR d.owner_user_id = $1
          OR da.user_id IS NOT NULL
        )
      ORDER BY d.document_id`,
    [user.id, user.role]
  );

  return rows.map((row) => row.document_id);
}

export async function getDocumentVisibleToUser(documentId, user) {
  const { rows } = await pool.query(
    `SELECT d.*
       FROM campus_app.documents d
       LEFT JOIN campus_app.document_access da
         ON da.document_id = d.document_id AND da.user_id = $2
      WHERE d.document_id = $1
        AND (
          $3::text = 'admin'
          OR d.visibility = 'PUBLIC'
          OR d.owner_user_id = $2
          OR da.user_id IS NOT NULL
        )
      LIMIT 1`,
    [documentId, user.id, user.role]
  );
  return rows[0] || null;
}

export function serializeDocument(row) {
  return {
    document_id: row.document_id,
    title: row.title,
    original_filename: row.original_filename,
    document_type: row.document_type,
    department: row.department,
    semester: row.semester,
    visibility: row.visibility,
    ingest_status: row.ingest_status,
    chunks_count: row.chunks_count,
    tags: row.tags || [],
    has_file: Boolean(row.storage_path),
    owner_user_id: row.owner_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
