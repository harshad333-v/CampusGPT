# CampusGPT AI Service — Deployment Notes

This deployment work targets the existing AI service in this repository. It does not create a second application.

## Non-negotiable compatibility requirements

- Keep the existing HTTP endpoints, methods, request models, and response models unchanged:
  - GET /health
  - POST /v1/chat
  - POST /v1/documents/ingest
  - DELETE /v1/documents/{document_id}
- Preserve the current NLP → routing → retrieval → context → Gemini-compatible generation RAG workflow.
- Keep credentials out of source files, Git, container images, and frontend variables.
- Current local development defaults remain Chroma + Ollama.

## Local .env configuration

1. From ai-services, copy .env.example to .env.
2. For local development, leave VECTOR_STORE_BACKEND=chroma and EMBEDDING_PROVIDER=ollama.
3. To test against the existing Supabase project, configure these values in your local .env:
   - VECTOR_STORE_BACKEND=supabase
   - EMBEDDING_PROVIDER=voyage
   - EMBEDDING_MODEL=voyage-4-lite
   - EMBEDDING_DIMENSIONS=1024
   - EMBEDDING_API_KEY = your Voyage API key
   - DATABASE_URL = the project connection string from Supabase Dashboard → Connect, with the database password URL-encoded and sslmode=require
   - PGVECTOR_COLLECTION_NAME=campusgpt
4. Do not send the actual password/key through chat and never commit .env.
5. The direct database host is db.uoopgnbpdazpuokjduol.supabase.co. If your network is IPv4-only and direct connection fails, use the Supabase Session pooler connection string shown in Dashboard → Connect. Supabase documents direct connections for long-lived backends and session pooling for persistent clients on IPv4-only networks: https://supabase.com/docs/guides/database/connecting-to-postgres
6. When selecting the Supabase backend, embedding dimensions must match the database vector column. The provisioned embedding column is extensions.vector(1024).

## Supabase database setup

The connected project has pgvector 0.8.0 installed in the extensions schema. These internal LangChain vector tables have been created:
- public.langchain_pg_collection
- public.langchain_pg_embedding

The embedding table uses a 1024-dimensional vector, HNSW cosine index, a JSONB metadata index, and a collection filter index. Row-level security is enabled and direct table grants are revoked from anon and authenticated; the application should connect server-side with its PostgreSQL connection string, not a browser key.

For repeatable project setup, the SQL files are:
1. migrations/001_enable_pgvector.sql
2. migrations/002_create_search_indexes.sql

These SQL files are safe to re-run for the current schema, but dimension changes require a planned migration/reindex—not an in-place blind change.

## Docker smoke test

From this directory:

    docker build -t campusgpt-ai:deployment .
    docker run --rm -p 8000:8000 --env-file .env campusgpt-ai:deployment

Then verify the existing health route:

    Invoke-RestMethod http://localhost:8000/health

The Docker image intentionally excludes .env, local vector data, development documents, and Git metadata. Runtime secrets are passed separately.

## Important ingestion hosting caveat

The existing ingestion endpoint accepts a server-side file_path. In a cloud container, a Windows developer path will not exist unless the file is made available inside the container. Coordinate with the backend teammate on the existing file-storage handoff. Do not change the endpoint request schema; solve path resolution/storage behind it.

## Before production launch

- Confirm the Gemini WebSocket gateway can be reached from the hosting region and is suitable for production use.
- Configure backup/recovery, HTTPS, rate limiting, log redaction, error tracking, and deployment rollback.
- Keep the existing document authorization contract: the Node/Express backend continues sending the authorized document IDs.
- Re-embed every chunk with voyage-4-lite before using Supabase for retrieval. Local nomic-embed-text vectors are not compatible.
- Verify authorization, English/Hinglish retrieval tests, latency, and load at 10/20/50 concurrent users.
- Do not remove the existing Chroma data until cutover checks and rollback have passed.

## Scope

The implementation adds deployment configuration and a selectable Supabase/Voyage adapter behind the existing vector-store interface. It intentionally does not change public endpoints or response schemas. It does not deploy the backend or perform a production data migration.
