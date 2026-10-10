# CampusGPT AI Service — Deployment Notes

These files prepare the existing AI service in this repository for container deployment. They do not create a second application.

## Non-negotiable compatibility requirements

- Keep the existing HTTP endpoints, methods, request models, and response models unchanged:
  - GET /health
  - POST /v1/chat
  - POST /v1/documents/ingest
  - DELETE /v1/documents/{document_id}
- Preserve the current NLP → routing → retrieval → context → Gemini-compatible generation workflow.
- Changes in this branch are behind the existing API boundary.
- Do not commit real credentials or expose database/embedding/gateway keys to the frontend.

## Configuration

1. Copy `.env.example` to `.env` from the `ai-services` directory for local development.
2. Keep the default `VECTOR_STORE_BACKEND=chroma` and `EMBEDDING_PROVIDER=ollama` for the existing local setup.
3. Production should use the deployment platform's secret store to configure `DATABASE_URL`, `EMBEDDING_API_KEY`, `GEMINI_BASE_URL`, and `GEMINI_API_KEY`.
4. To use Supabase, configure `VECTOR_STORE_BACKEND=supabase`, `EMBEDDING_PROVIDER=voyage`, the matching model/dimension values, and a secure server-side PostgreSQL connection string. The direct database URL must include SSL (commonly `sslmode=require`); use the Supabase-provided connection string or pooler for the chosen hosting environment.
5. Enable the pgvector extension in Supabase before starting the backend with the Supabase vector backend.
6. Re-index all chunks using the selected embedding model before serving production queries. Vectors from `nomic-embed-text` are not compatible with Voyage vectors.
7. Do not point the production process at the development Chroma directory.

## Docker smoke test

From this directory:

```powershell
docker build -t campusgpt-ai:deployment .
docker run --rm -p 8000:8000 --env-file .env campusgpt-ai:deployment
```

Then verify the existing health route:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

The Docker image intentionally excludes `.env`, local vector data, development documents, and Git metadata. Runtime secrets are passed separately.

## Supabase notes

- The backend connects directly to PostgreSQL using `DATABASE_URL`; a Supabase service-role REST key is not needed for the current pgvector approach.
- The configured LangChain PostgreSQL vector store creates/uses its own `langchain_pg_collection` and `langchain_pg_embedding` tables in the selected database schema. The database account needs the required table/index permissions during initial setup.
- Run `migrations/001_enable_pgvector.sql` in the Supabase SQL editor first.
- Launch the backend once with the Supabase backend configured to initialize the LangChain tables, then run `migrations/002_create_search_indexes.sql` to add metadata and HNSW indexes.
- Test the complete Supabase path in staging before switching production traffic.
- PostgreSQL document deletion is implemented internally by selecting chunk IDs scoped to the configured collection and exact `document_id`; the public DELETE endpoint remains unchanged.

## Document ingestion caveat

The existing ingestion endpoint accepts a server-side `file_path`. The container image excludes development PDFs by design. At deployment time, the provided path must resolve to a file visible to the running container. Coordinate with the backend teammate on the existing file-storage handoff. If the current backend passes a Windows host path, that path will not exist inside a cloud container; fix the internal storage resolution without changing the endpoint's request schema.

## Before production launch

- Confirm the Gemini WebSocket gateway is suitable for production use, and configure its secure reachable URL and authentication.
- Configure database backups, HTTPS, rate limits, log redaction, error tracking, and rollback.
- Preserve the existing document authorization contract: the Node/Express backend continues sending authorized document IDs as it does today.
- Load-test chat and the Gemini gateway at 10, 20, and 50 concurrent requests.
- Keep the old Chroma data available until the migration and retrieval comparisons pass.

## Scope

This branch adds deployment configuration and a selectable PostgreSQL/Voyage adapter behind the existing RAG interface. It does not change API routes or response models, and it does not provision any cloud services or perform a data migration.
