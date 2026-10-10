-- Enable pgvector in Supabase's recommended extensions schema.
-- Safe to re-run in the existing CampusGPT Supabase project.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
