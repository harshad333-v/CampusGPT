-- Install pgvector in Supabase's recommended extensions schema.
-- Create an isolated schema so this service does not collide with other
-- applications' tables in the shared project's public schema.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS campusgpt AUTHORIZATION postgres;
GRANT USAGE, CREATE ON SCHEMA campusgpt TO postgres;
GRANT USAGE ON SCHEMA extensions TO postgres;
