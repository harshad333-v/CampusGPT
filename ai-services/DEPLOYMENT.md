# CampusGPT AI Service — Deployment Notes

This work targets the existing AI service; it does not create a replacement. Keep the public API contract and existing NLP → routing → retrieval → context → Gemini-compatible generation workflow unchanged.

## Existing API contract

- `GET /health`
- `POST /v1/chat`
- `POST /v1/documents/ingest`
- `DELETE /v1/documents/{document_id}`

## Supabase + Voyage configuration

The vector store is in the private `campusgpt` schema in Supabase project `uoopgnbpdazpuokjduol`. Use the server-side PostgreSQL connection URL in the AI service `.env`; never expose it to frontend code. For IPv4-only environments, use the Supabase Session Pooler connection string. URL-encode reserved characters in the password and require SSL.

Set these values in `ai-services/.env` when selecting hosted storage:

```dotenv
VECTOR_STORE_BACKEND=supabase
EMBEDDING_PROVIDER=voyage
EMBEDDING_MODEL=voyage-4-lite
EMBEDDING_DIMENSIONS=1024
EMBEDDING_API_KEY=YOUR_VOYAGE_API_KEY
DATABASE_URL=YOUR_SUPABASE_POSTGRES_URL
PGVECTOR_COLLECTION_NAME=campusgpt
PGVECTOR_SCHEMA_NAME=campusgpt
```

The vector column is `vector(1024)`. Documents must be embedded with the same model/dimension used for queries. Re-embed when changing from the local Nomic model to Voyage; the vector spaces are not interchangeable.

## OCR

The PDF loader first uses normal text extraction and then OCRs pages with no extractable text. The Python wrapper is pinned in `requirements.txt`; Docker installs the Tesseract executable. OCR-extracted dates and names should be checked against the original scan.

## Local checks

```powershell
python -m scripts.check_supabase_voyage
python -m pytest -v
python -m uvicorn app.main:app --reload
```

## Docker smoke test

From `ai-services`:

```powershell
docker build -t campusgpt-ai:deployment .
docker run --rm -p 8000:8000 --env-file .env campusgpt-ai:deployment
Invoke-RestMethod http://localhost:8000/health
```

For the full-stack Compose setup, use the repository-root `docker-compose.fullstack.yml` and `.env.fullstack.example` as documented in `README_FULLSTACK.md`.

## Ingestion path caveat

The existing ingestion endpoint accepts a server-side `file_path`. In cloud/container deployments, the path must exist inside the AI service container. The full-stack Compose configuration mounts shared storage into both the backend and AI service without changing the API request schema.

## Production checklist

- Use a secret manager; never commit `.env` files or put secrets in frontend variables.
- Ensure the Gemini-compatible gateway is reachable and approved for the deployment environment.
- Configure HTTPS, backups, rate limiting, log redaction, error monitoring, and rollbacks.
- Preserve the backend's server-side document authorization allow-list.
- Review any Supabase security advisor warnings on unrelated existing `public` tables separately before production.
