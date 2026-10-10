-- CampusGPT uses langchain-postgres PGVector behind its existing vector-store
-- interface. This schema matches langchain-postgres's table names/columns.
-- Run after 001_enable_pgvector.sql and before application startup.
-- The selected production embedding is voyage-4-lite at 1024 dimensions.
-- If the model/dimension changes later, plan a new collection/schema and reindex.
CREATE TABLE IF NOT EXISTS public.langchain_pg_collection (
    uuid uuid PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    cmetadata json
);

CREATE TABLE IF NOT EXISTS public.langchain_pg_embedding (
    id varchar PRIMARY KEY,
    collection_id uuid
        REFERENCES public.langchain_pg_collection(uuid)
        ON DELETE CASCADE,
    embedding extensions.vector(1024),
    document varchar,
    cmetadata jsonb
);

CREATE INDEX IF NOT EXISTS ix_cmetadata_gin
    ON public.langchain_pg_embedding
    USING gin (cmetadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS campusgpt_embedding_hnsw_idx
    ON public.langchain_pg_embedding
    USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX IF NOT EXISTS campusgpt_embedding_collection_id_idx
    ON public.langchain_pg_embedding (collection_id);

-- These are internal RAG tables, not browser-facing Data API tables.
ALTER TABLE public.langchain_pg_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.langchain_pg_embedding ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.langchain_pg_collection FROM anon, authenticated;
REVOKE ALL ON TABLE public.langchain_pg_embedding FROM anon, authenticated;
