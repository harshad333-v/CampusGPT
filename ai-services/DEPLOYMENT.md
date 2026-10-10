# CampusGPT AI Service — Deployment Notes

This is deployment configuration for the existing AI service in this repository. It does not create another application.

## Non-negotiable compatibility requirements

- Keep the existing HTTP endpoints, methods, request models, and response models unchanged:
  - GET /health
  - POST /v1/chat
  - POST /v1/documents/ingest
  - DELETE /v1/documents/{document_id}
- Preserve the current NLP → routing → retrieval → context → Gemini-compatible generation RAG workflow.
- Do not merge the deployment branch until regression tests run against the actual runtime and database.
- Never copy actual credentials to Git or frontend environment variables.

## Configuration

1. Copy `.env.example` to `.env` for local use.
2. Replace placeholder values only on your local machine.
3. `.env` is ignored by Git. Do not commit it.
4. In production, set secrets using the hosting provider's secret manager/runtime environment, not in the image.
5. Do not enable `VECTOR_STORE_BACKEND=supabase` until the Supabase repository adapter and schema migration have been implemented, dimension-checked, and tested. The example currently defaults to the existing Chroma backend.

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

The Docker image intentionally excludes `.env`, local vector data, sample documents, and Git metadata. Runtime secrets are passed separately.

## Before production launch

- Confirm the Gemini gateway is approved/suitable for production and configure its URL/key.
- Implement and validate the selected hosted embedding provider.
- Implement Supabase pgvector migrations and retrieval repository before switching the backend.
- Re-index documents with the same embedding model that will be used for queries; do not reuse vectors from a different embedding model.
- Use a secure server-side PostgreSQL connection string and least-privilege access.
- Configure health checks, logs/metrics, database backups, HTTPS, rate limits, and deployment rollback.
- Ensure the Node/Express backend continues sending authorized document IDs to the AI service as it does today.
- Load-test chat and the Gemini gateway; validate the end-to-end target at 10, 20, and 50 concurrent requests.

## Scope of this branch

The files in this branch add environment examples and a container build entry point. They do not switch the active vector implementation, alter API routes, or migrate production data. Supabase and hosted embeddings are the next implementation step, after the chosen provider and schema are verified.
