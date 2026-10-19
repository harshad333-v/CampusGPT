# CampusGPT Full-stack Setup

The repository is split into three services: the existing FastAPI RAG/AI layer (`ai-services/`), a new Node.js/Express web backend (`backend/`), and a React + TypeScript frontend (`frontend/`). The API routes and request/response models of the existing FastAPI service remain unchanged.

## What this adds

- Registration/login/logout with password hashing and an HTTP-only session cookie.
- PostgreSQL-backed users, conversations, document metadata, and document sharing in a separate `campus_app` schema.
- Server-side document authorization and proxying to the existing `/v1/chat` service.
- Upload/index/reindex/download/delete document endpoints and an admin/staff UI.
- OCR fallback for scanned PDF pages using Tesseract + `pytesseract`.
- Dockerfiles and a repository-root Docker Compose configuration.

## Local development (Windows PowerShell)

### 1. AI service

From `ai-services/`, configure its `.env` with the existing Supabase + Voyage settings and ensure the Gemini-compatible gateway is reachable.

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

### 2. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Set `DATABASE_URL`, `JWT_SECRET` (at least 32 random characters), `AI_SERVICE_URL=http://127.0.0.1:8000`, and `SHARED_DOCUMENTS_DIR` in `backend/.env`. If running processes separately, use a file directory both processes can access. Apply the app-only schema and register existing vector documents:

```powershell
npm run migrate
npm run seed:existing-documents
npm run bootstrap:admin
npm run dev
```

Configure `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` before running the admin bootstrap command. Seed refuses an empty vector collection. Existing PDFs indexed earlier are metadata-registered; the seed operation does not re-embed their vectors.

Health: `http://localhost:4000/api/health`

### 3. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the web backend.

## Docker Compose

At repository root, copy `.env.fullstack.example` to `.env.fullstack` and configure real connection strings, Voyage key, and a newly generated JWT secret. Never commit `.env.fullstack` or any real credentials.

```powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up --build
```

Web UI: `http://localhost:5173`; backend health: `http://localhost:4000/api/health`. The integrated stack mounts a shared documents volume into the Node backend and the AI service so `file_path` remains accessible without changing the ingestion API schema.

After vectors exist, run the existing-document seed and admin bootstrap commands inside the backend container as described in `backend/README.md`.

## Security and architecture notes

- Do not expose the `campusgpt` vector schema through Supabase Data API schemas; the services connect server-side using PostgreSQL.
- The server calculates authorized document IDs. The browser is not allowed to submit the AI-service allow-list itself.
- An empty access list means no additional retrieval restriction in the existing AI service. The backend must therefore return a safe empty-document answer when a user has no authorized documents, not pass an empty list expecting it to deny all records.
- Seeded pre-existing documents have no local downloadable file path through the web app unless separately uploaded.
- Existing production `public` tables are left untouched by the `campus_app` migration.

## Tests and production readiness

Run `npm test` in `backend/`; run `python -m pytest -v` in `ai-services/`. A full browser build and live deployment should be run after credentials and external gateway connectivity are configured. Before production, configure HTTPS, backups, observability, rate limiting, password-reset/email verification, rollback, and secret rotation. Inspect OCR-recognized details such as dates and names against original scans.
