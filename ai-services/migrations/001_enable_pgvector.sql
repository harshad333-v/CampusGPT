-- Run this migration in the Supabase SQL Editor before selecting
-- VECTOR_STORE_BACKEND=supabase. Supabase may already have the extension;
-- IF NOT EXISTS makes this safe to re-run.
CREATE EXTENSION IF NOT EXISTS vector;
