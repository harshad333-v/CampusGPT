# CampusGPT Full-stack Manifest

## Added web backend (`backend/`)
- Express app/server/configuration and PostgreSQL pool.
- Idempotent migration creating an isolated `campus_app` schema.
- Register/login/logout/current-user routes; password hashing; HTTP-only cookie sessions.
- Chat proxy with server-side document allow-list, conversation history, and source metadata.
- Document listing, upload/index/reindex/download/delete, share ACLs, and admin user/role management.
- Bootstrap administrator and registration of the existing eight vector-indexed documents.
- Authorization regression tests and container build.

## Added frontend (`frontend/`)
- React + TypeScript + Vite UI.
- Login/register screens, chat history, grounded answers and source citations.
- Document upload and management, admin role-management view, responsive styling.
- Production Nginx configuration and container build.

## Integration files
- `docker-compose.fullstack.yml`, `.env.fullstack.example`, `.dockerignore`, `.gitignore`.
- `ai-services/Dockerfile.fullstack` and OCR-enabled `ai-services/app/rag/loaders/document_loader.py`.
- `pytesseract` pinned in `ai-services/requirements.txt`; base AI Docker image installs Tesseract OCR.

## Validation recorded at packaging time
- Node JavaScript syntax checks and two built-in Node tests passed.
- Frontend TS/TSX syntax parsing and package JSON checks passed.
- Compose YAML parsing passed.
- Full frontend production build and live database end-to-end checks were not completed in the packaging environment; run them before deployment.
