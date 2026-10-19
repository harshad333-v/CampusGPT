# CampusGPT Web Backend

This Node.js/Express service fills the repository's `backend/` placeholder. The existing FastAPI RAG service stays in `ai-services/`; its public API paths and schemas remain unchanged.

## Responsibilities
- Authentication using bcrypt password hashes and HTTP-only session cookies.
- Server-side document access policy and calls to the existing FastAPI `/v1/chat` service.
- Conversations/messages, documents, shared ACLs, uploads, reindex, download, and deletion.
- New metadata tables in a separate PostgreSQL `campus_app` schema.

## Setup (Windows PowerShell)
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run migrate
npm run seed:existing-documents
# Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env first.
npm run bootstrap:admin
npm run dev
```

Use Node.js 20+. Configure `DATABASE_URL`, a 32+ character random `JWT_SECRET`, `AI_SERVICE_URL`, `SHARED_DOCUMENTS_DIR`, and cookie settings in `.env`. For local services, the backend and AI service must share the same absolute path for uploaded files. Docker Compose mounts a shared volume.

## Routes
- `/api/auth`: register, login, logout, current session
- `/api/chat`: chat proxy with per-user server-side allow-list
- `/api/conversations`: list, read messages, delete
- `/api/documents`: list, upload/index, share access, reindex, download, delete
- `/api/users`: admin user list and student/staff role assignment

New registrations always receive `student` role. Public/shared document IDs are computed on the server. Because the existing AI service treats an empty access list as unrestricted, the web backend does not make an unscoped AI request when the user has no authorized documents.

`npm run seed:existing-documents` registers existing vector-indexed document metadata only; it does not re-embed or copy original files. Existing documents added this way have no download path until the original file is uploaded to the web backend.

Never commit `.env` or expose database/provider credentials to the browser. Production deployment still needs HTTPS, backups, monitoring, rate limiting, secret rotation, and a review of document visibility/authorization policy.