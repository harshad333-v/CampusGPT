# CampusGPT

CampusGPT is a university information assistant composed of a React frontend, Node.js/Express web backend, and FastAPI retrieval-augmented generation (RAG) service.

## Services

- [Frontend](frontend/) — React + Vite student, teacher, and administrator interfaces.
- [Backend](backend/) — authentication, role-aware document access, chat sessions, uploads, and the server-to-server AI integration.
- [AI service](ai-services/README.md) — FastAPI, NLP/routing, document parsing and indexing, Ollama embeddings, persistent ChromaDB, and Gemini Web API answer generation.
- [Full-stack setup and integration guide](README_FULLSTACK.md) — local startup, Docker Compose, environment configuration, administrator bootstrap, sample document seeding, and end-to-end verification.

## Request flow

The browser calls only the Express backend via `/api/v1`. The backend authenticates the user and computes the allowed document IDs based on current role and document visibility. FastAPI retrieves only from that allow-list, uses local Ollama embeddings with ChromaDB, and sends the grounded context to the configured Gemini-compatible gateway. The backend persists the answer and validated source citations for the frontend.

## Quick start

See [README_FULLSTACK.md](README_FULLSTACK.md) for the prerequisites and exact commands to run all three services locally or with Docker Compose.

Never commit real `.env` files, JWT secrets, database credentials, API keys, or private document corpora.
