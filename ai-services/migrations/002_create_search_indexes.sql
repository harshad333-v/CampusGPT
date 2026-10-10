-- Run only after the backend has initialized langchain_pg_embedding
-- and langchain_pg_collection in the target schema.
-- The configured Voyage model in the example returns 1024 dimensions.
-- Confirm the embedding column type/dimension and schema before running in production.
-- langchain-postgres already creates its JSONB metadata GIN index.
-- Keep this migration focused on the vector index used by cosine similarity.
CREATE INDEX IF NOT EXISTS campusgpt_embedding_hnsw_idx
    ON public.langchain_pg_embedding
    USING hnsw (embedding vector_cosine_ops);
