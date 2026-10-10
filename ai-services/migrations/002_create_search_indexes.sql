-- Run only after the backend has initialized langchain_pg_embedding
-- and langchain_pg_collection in the target schema.
-- The configured Voyage model in the example returns 1024 dimensions.
-- Confirm the embedding column and schema before running in production.
CREATE INDEX IF NOT EXISTS campusgpt_embedding_hnsw_idx
    ON public.langchain_pg_embedding
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS campusgpt_embedding_metadata_gin_idx
    ON public.langchain_pg_embedding
    USING gin (cmetadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS campusgpt_collection_name_idx
    ON public.langchain_pg_collection (name);
