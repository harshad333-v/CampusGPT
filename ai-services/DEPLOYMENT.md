# CampusGPT AI Service — Deployment Notes

This deployment work targets the existing AI service in this repository. It does not create a second application.

## Non-negotiable compatibility requirements

- Keep the existing HTTP endpoints, methods, request models, and response models unchanged:
  - GET /health
  - POST /v1/chat
  - POST /v1/documents/ingest
  - DELETE /v1/documents/{document_id}
- Preserve the current NLP → routing → retrieval → context → Gemini-compatible generation workflow.
- Keep credentials out of source files, Git, container images, and frontend variables.
- Local development defaults remain Chroma + Ollama.

## Supabase project connection

The connected Supabase project ref is `uoopgnbpdazpuokjduol`, URL `https://uoopgnbpdazpuokjduol.supabase.co`, region `ap-northeast-2`. The PostgreSQL project already contains unrelated tables in `public`, so CampusGPT's vector tables use a dedicated `campusgpt` schema to avoid conflicts.

The database setup is split into these idempotent SQL files:
1. `migrations/001_enable_pgvector.sql` — installs pgvector in `extensions` and creates the `campusgpt` schema.
2. `migrations/002_create_search_indexes.sql` — creates the LangChain vector tables and indexes in `campusgpt`.

Do not add `campusgpt` to Supabase's exposed Data API schemas. The FastAPI service uses a server-side PostgreSQL connection, not a browser key.

## Local .env configuration

1. From `ai-services`, copy `.env.example` to `.env`.
2. Keep `VECTOR_STORE_BACKEND=chroma` and `EMBEDDING_PROVIDER=ollama` for local development.
3. To use Supabase, configure these variables in your local `.env` or deployment secret store:
   - `VECTOR_STORE_BACKEND=supabase`
   - `EMBEDDING_PROVIDER=voyage`
   - `EMBEDDING_MODEL=voyage-4-lite`
   - `EMBEDDING_DIMENSIONS=1024`
   - `EMBEDDING_API_KEY` — the Voyage API key
   - `DATABASE_URL` — the database connection string copied from Supabase Dashboard → Connect, with URL-encoded password and SSL enabled
   - `PGVECTOR_COLLECTION_NAME=campusgpt`
   - `PGVECTOR_SCHEMA_NAME=campusgpt`
4. Do not share the database password or embedding key in chat and never commit `.env`.
5. If your deployment is IPv4-only, use Supabase's Session pooler connection string (port 5432). Direct DB host connections are IPv6-only unless your project/network has IPv4 support. Keep the database connection URL private.
6. The vector column has 1024 dimensions. The query and document embedding model must match this configuration exactly.

## Docker smoke test

From this directory:

```powershell
docker build -t campusgpt-ai:deployment .
docker run --rm -p 8000:8000 --env-file .env campusgpt-ai:deployment
```

Then verify the existing health endpoint:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

The Docker image intentionally excludes `.env`, local vector data, development documents, and Git metadata. Runtime secrets are passed separately.

## Important ingestion hosting caveat

The existing ingestion endpoint accepts a server-side `file_path`. In a cloud container, a Windows developer path will not exist unless the file is made available inside the container. Coordinate with the backend teammate on the existing file-storage handoff. Do not change the endpoint request schema; solve path resolution/storage behind it.

## Before production launch

- Confirm the Gemini WebSocket gateway is reachable from the hosting region and is suitable for production use.
- Configure backups, HTTPS, rate limiting, log redaction, error tracking, and deployment rollback.
- Preserve the current document authorization contract: the Node/Express backend continues sending authorized document IDs.
- Re-embed every chunk with the selected production model before cutover. Local `nomic-embed-text` vectors are not compatible with Voyage vectors.
- Verify English/Hinglish retrieval, document authorization, latency, and load at 10/20/50 concurrent users.
- Keep current Chroma data available until the migration and retrieval comparison are complete.

## Scope

This deployment configuration stays behind the existing RAG interface. It intentionally does not alter public endpoints or response schemas, deploy the backend, or migrate the local production corpus.
