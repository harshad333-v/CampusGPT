-- CampusGPT uses langchain-postgres PGVector behind its existing vector-store
-- interface. Keep its tables in the private, dedicated campusgpt schema.
-- Run after 001_enable_pgvector.sql.
-- Selected production model/dimension: voyage-4-lite / 1024.
-- Re-embed all content if the embedding model or dimension changes.
CREATE TABLE IF NOT EXISTS campusgpt.langchain_pg_collection (
    uuid uuid PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    cmetadata json
);

CREATE TABLE IF NOT EXISTS campusgpt.langchain_pg_embedding (
    id varchar PRIMARY KEY,
    collection_id uuid
        REFERENCES campusgpt.langchain_pg_collection(uuid)
        ON DELETE CASCADE,
    embedding extensions.vector(1024),
    document varchar,
    cmetadata jsonb
);

CREATE INDEX IF NOT EXISTS ix_cmetadata_gin
    ON campusgpt.langchain_pg_embedding
    USING gin (cmetadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS campusgpt_embedding_hnsw_idx
    ON campusgpt.langchain_pg_embedding
    USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX IF NOT EXISTS campusgpt_embedding_collection_id_idx
    ON campusgpt.langchain_pg_embedding (collection_id);

-- These internal vector tables are not browser-facing Data API tables.
ALTER TABLE campusgpt.langchain_pg_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE campusgpt.langchain_pg_embedding ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE campusgpt.langchain_pg_collection FROM anon, authenticated;
REVOKE ALL ON TABLE campusgpt.langchain_pg_embedding FROM anon, authenticated;
