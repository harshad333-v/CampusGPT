# CampusGPT — Full-Stack Integration

CampusGPT runs as three services:

- **Frontend:** React + Vite, normally on port 3000 for development or 5173 in Docker.
- **Web backend:** Node.js + Express + MongoDB, on port 4000.
- **AI service:** FastAPI + Ollama embeddings + persistent ChromaDB, with answer generation through the Gemini-compatible Web API gateway.

The browser communicates only with the Express backend. The backend authenticates users, computes which documents their role may access, calls the AI service, and saves conversations. The browser never supplies the AI service's authorized-document allow-list.

## End-to-end chat flow

1. A student, teacher, or administrator signs in through the web backend.
2. The frontend creates/loads a chat session and submits a message to `/api/v1/chat/sessions/:id/messages`.
3. Express verifies the user/session, finds documents visible to that role, and calls `POST /v1/chat` on the AI service with only those AI document IDs.
4. FastAPI applies its intent and metadata retrieval, uses local Ollama embeddings and ChromaDB, and sends only answer-generation context to the configured Gemini Web API gateway.
5. Express validates returned sources against the authorized MongoDB document set, saves the response and source metadata, and returns the chat result.
6. The student/teacher chat UI renders the answer and its source titles/page numbers.

Document uploads from admin/teacher pages are stored in the shared file directory and indexed by FastAPI. Editing document metadata triggers re-indexing; deletion removes its AI vectors before the source metadata/file is removed.

## Local development — Windows PowerShell

### Prerequisites

Install Node.js 22, Python 3.11, MongoDB, Ollama, and start your Gemini Web API gateway. The gateway must accept OpenAI-compatible requests at `/v1/chat/completions`; by default it is expected at `http://127.0.0.1:8081/v1`.

### 1. Start MongoDB, Ollama, and the Gemini gateway

Start the MongoDB service. For local embeddings:

```powershell
ollama pull nomic-embed-text:latest
ollama list
```

Keep the Gemini Web API gateway running in its own terminal. If its URL or exposed model differs, update `GEMINI_BASE_URL` and `GEMINI_MODEL` in `ai-services/.env`.

### 2. Start the AI service

```powershell
cd ai-services
if (!(Test-Path .env)) { Copy-Item .env.example .env }
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/check_local_setup.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If `ai-services/.env` already exists, keep it and check that the active values use Ollama + Chroma and your Gemini gateway URL.

AI health: `http://127.0.0.1:8000/health`. Swagger: `http://127.0.0.1:8000/docs`.

### 3. Configure and start the backend

Open a second terminal:

```powershell
cd backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
```

Set `MONGO_URI`, `JWT_SECRET` (a new random value with at least 32 characters), `AI_SERVICE_URL=http://127.0.0.1:8000`, and `SHARED_DOCUMENTS_DIR=./uploads` in `backend/.env`. Keep the directory shared between your backend and AI service processes by running them on the same Windows machine. Never commit either service's real `.env`.

You can generate a JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run static checks and tests:

```powershell
npm run check
npm test
```

Create the initial administrator once. In the same PowerShell terminal, set private values for the current shell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@your-college.edu"
$env:BOOTSTRAP_ADMIN_PASSWORD = "replace-with-a-unique-password-of-12-or-more-characters"
npm run bootstrap:admin
```

After the admin exists, register and index the bundled starter documents:

```powershell
npm run seed:documents
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
npm run dev
```

The seed command is idempotent. It registers the sample PDFs under stable AI document IDs and indexes/re-indexes them through the AI service. It requires an active admin account and files under `ai-services/data/`. Run the command again to reindex those sample PDFs after deleting/recreating the local Chroma collection.

Backend health: `http://127.0.0.1:4000/api/health`.

### 4. Start the frontend

In a third terminal:

```powershell
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` requests to `http://127.0.0.1:4000`; the browser does not need a direct connection to the AI service.

## Docker Compose — integrated local profile

This Compose profile includes MongoDB, Ollama, ChromaDB, FastAPI, Express, and the frontend. The Gemini Web API gateway remains a separate process and must be accessible from Docker Desktop at `http://host.docker.internal:8081/v1`.

1. At the repository root, copy the example environment file and set a new JWT secret:

```powershell
Copy-Item .env.fullstack.example .env.fullstack
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Put the generated value into JWT_SECRET in .env.fullstack.
```

2. Start the stack:

```powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up --build -d
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml ps
```

Ollama downloads `nomic-embed-text:latest` during first startup. The sample PDFs are mounted read-only into both the backend and AI containers; uploads use a separate shared writable volume. Chroma and MongoDB persist in named volumes.

3. Bootstrap an administrator. Choose a unique email and strong password; do not commit them to `.env.fullstack`:

```powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml exec -e BOOTSTRAP_ADMIN_EMAIL=admin@your-college.edu -e BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-unique-password backend npm run bootstrap:admin
```

4. Register/index bundled sample documents:

```powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml exec -e BOOTSTRAP_ADMIN_EMAIL=admin@your-college.edu backend npm run seed:documents
```

The commands are safe to rerun: bootstrap stops if the account already exists and the document seed upserts sample metadata and re-indexes each document.

Open the UI at `http://localhost:5173`. Check health at `http://localhost:4000/api/health` and `http://localhost:5173/api/health`. The AI service is private to the Compose network.

Common commands:

```powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml logs -f backend ai-service
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml down
```

`down` preserves named volumes. Do not use `down -v` unless you explicitly intend to delete MongoDB, Chroma, Ollama model data, and uploaded documents.

## Environment settings

- `backend/.env`: `MONGO_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, `SHARED_DOCUMENTS_DIR`, CORS origins, and optional SMTP credentials.
- `ai-services/.env`: `GEMINI_BASE_URL`, `GEMINI_MODEL`, `EMBEDDING_PROVIDER=ollama`, `OLLAMA_BASE_URL`, `VECTOR_STORE_BACKEND=chroma`, and Chroma persistence settings.
- `.env.fullstack`: Compose-level JWT secret and Gemini model/gateway settings.

Document upload/indexing currently supports **PDF and DOCX**, matching the AI service loaders. Each upload must have a department, document type, and required metadata accepted by the backend schema.

## Verification checklist

Run the following locally before considering the branch ready:

```powershell
# backend/
npm run check
npm test

# frontend/
npm run lint
npm run build

# ai-services/
python -m pytest -v
python scripts/check_local_setup.py
```

Use the end-to-end checker from the repository root after the services are running:

```powershell
# Local multi-terminal development (frontend :3000, backend :4000, AI :8000)
.\scripts\verify_fullstack.ps1

# Actual login -> chat session -> backend -> AI -> grounded answer/source check
.\scripts\verify_fullstack.ps1 -ChatSmokeTest -LoginEmail admin@your-college.edu

# Docker Compose (AI service is intentionally private, so skip its direct host health URL)
.\scripts\verify_fullstack.ps1 -FrontendUrl http://127.0.0.1:5173 -BackendUrl http://127.0.0.1:4000 -SkipAIHealth -ChatSmokeTest -LoginEmail admin@your-college.edu
```

The smoke test prompts for the password as a secure input, does not print the access token, creates a chat session, and leaves that test session in the UI so you can inspect it. Its default question depends on the bundled Raksha Bandhan notice being indexed and visible to the test account. For Docker mode the AI health check is skipped because the AI port is not published; the authenticated chat request still exercises the backend-to-AI path.

Then perform a manual role/access smoke test: sign in separately as an administrator, teacher, and student; submit a campus question in both student and teacher chat; verify a grounded answer shows sources; verify a student cannot retrieve a `TEACHER_ONLY` document; upload a PDF/DOCX as a teacher/admin; ask a question covered by that document; then update and delete it and confirm retrieval follows those changes. Frontend routes also guard role-specific pages, while backend authorization remains the security boundary.

## Security and operational notes

- The backend computes the document allow-list on every chat request and validates returned source IDs before saving them.
- When no documents are authorized, the backend explicitly asks FastAPI to deny document retrieval; it does not rely on an empty allow-list to deny access.
- Do not expose the AI service, MongoDB, or Ollama ports directly to untrusted networks. Use HTTPS, strong production database authentication, rate limiting, backup/restore drills, centralized logs, monitoring, and secret rotation before public deployment.
- The Compose profile is for local/integration use. A public production deployment needs hardened MongoDB authentication, TLS, restrictive CORS, and an appropriate private Gemini gateway endpoint.
