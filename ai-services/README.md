# CampusGPT AI Service

FastAPI + RAG service for CampusGPT. The local development profile is:

- **Generation:** Gemini Web API through an OpenAI-compatible gateway (default http://127.0.0.1:8081/v1)
- **Embeddings:** local Ollama model nomic-embed-text:latest (768 dimensions)
- **Vector database:** persistent local ChromaDB at ai-services/chroma_db/
- **Document processing:** local PDF/DOCX loading, chunking, timetable parsing, and optional OCR for scanned PDFs

No Voyage API key or Supabase database is required for this local profile. Only answer generation is sent to your configured Gemini Web API gateway.

## Quick start — Windows / PyCharm

From the repository root, open a terminal in ai-services:

~~~powershell
cd ai-services
.\scripts\setup_local.ps1
~~~

The script creates .venv, installs requirements.txt, and creates .env only when it does not already exist. It never overwrites existing credentials or settings.

If .env already exists from a previous Supabase/Voyage setup, open it and make sure these are the active values:

~~~dotenv
GEMINI_MODEL=gemini-3.6-flash
GEMINI_BASE_URL=http://127.0.0.1:8081/v1
GEMINI_API_KEY=not-needed

EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text:latest
EMBEDDING_DIMENSIONS=768
OLLAMA_BASE_URL=http://127.0.0.1:11434

VECTOR_STORE_BACKEND=chroma
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=campusgpt
~~~

Use a model name actually supported by the gateway if it does not expose gemini-3.6-flash. A process-level Windows environment variable takes priority over .env; see LOCAL_DEVELOPMENT.md if the setup checker reports Supabase/Voyage unexpectedly.

### Start the local embedding model

Install and start Ollama for Windows, then run:

~~~powershell
ollama pull nomic-embed-text
ollama list
~~~

Ollama should answer at http://127.0.0.1:11434. You do not need to run an Ollama generation model for this profile; Gemini Web API performs generation.

### Start Gemini Web API separately

Start your Gemini Web API gateway in its own terminal. It must expose an OpenAI-compatible chat-completions endpoint at:

~~~text
http://127.0.0.1:8081/v1/chat/completions
~~~

Check the model list if the gateway supports it:

~~~powershell
Invoke-RestMethod http://127.0.0.1:8081/v1/models
~~~

If this URL differs in your gateway, update GEMINI_BASE_URL in ai-services/.env. Keep the gateway running while CampusGPT uses the model.

### Check configuration, create the local index, and start FastAPI

~~~powershell
cd ai-services
.\.venv\Scripts\Activate.ps1
python scripts/check_local_setup.py
python scripts/ingest_directory.py --directory data
python -m pytest -v
python -m uvicorn app.main:app --reload
~~~

Ingesting PDFs and DOCX files creates embeddings locally through Ollama and writes the vectors to ChromaDB. The index persists across restarts in ai-services/chroma_db/, which is ignored by Git.

Open:
- Health: http://127.0.0.1:8000/health
- Swagger: http://127.0.0.1:8000/docs

## API contracts preserved

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /health | AI service health |
| POST | /v1/chat | Query NLP, retrieval, and grounded response |
| POST | /v1/documents/ingest | Load, chunk, embed, and index a PDF/DOCX |
| DELETE | /v1/documents/{document_id} | Delete indexed chunks for a document |

The request and response models for these routes remain unchanged. POST /v1/chat retains message, conversation, user_context, and accessible_document_ids. Existing NLP routing, timetable parsing, metadata-aware retrieval, source formatting, and grounding checks are retained.

## Local scripts

- scripts/setup_local.ps1 — create the virtual environment and install Python dependencies.
- scripts/check_local_setup.py — check local-mode settings, Ollama reachability/model availability, embedding generation, Chroma storage, and Gemini gateway reachability.
- scripts/ingest_directory.py — recursively ingest .pdf and .docx files. It maintains stable local document IDs, updates changed chunks, and removes stale chunks for the same imported document.
- scripts/inspect_chroma_index.py — read-only inventory of indexed document IDs and exact chunk text repeated across IDs. It never deletes or modifies vectors.
- scripts/cleanup_chroma_orphans.py — dry-run-first cleanup for chunks that have no `document_id` and exactly duplicate a chunk from the same filename under a valid document ID. Records with assigned IDs are never removed by this script.

Preview an import without changing the vector database:

~~~powershell
python scripts/ingest_directory.py --directory data --dry-run
~~~

Import another folder:

~~~powershell
python scripts/ingest_directory.py --directory "D:\Campus\college-documents"
~~~

Optional metadata arguments are --document-type, --department, --semester, --visibility, and repeatable --tag. Example:

~~~powershell
python scripts/ingest_directory.py --directory data --department CSE --semester 5 --tag college
~~~

Do not set a global --document-type for a folder containing mixed timetables, notices, and syllabi; let filename rules infer types or import folders by document category.

Inspect the current local index before considering any cleanup:

~~~powershell
python scripts/inspect_chroma_index.py
python scripts/inspect_chroma_index.py --match "Raksha Bandhan" --show-snippets
python scripts/cleanup_chroma_orphans.py
~~~

The audit is read-only. The cleanup command is also read-only unless you explicitly pass `--apply`; it only targets no-ID chunks that exactly duplicate content from the same file under a valid document ID, while rejecting conflicts in shared visibility/classification metadata. Review its dry-run output first, then use `python scripts/cleanup_chroma_orphans.py --apply` to delete those orphan duplicates. It never removes records with assigned document IDs. Different assigned IDs can still represent intentionally separate records, so do not delete those solely because their chunk text matches. Never clear the entire collection to fix a duplicate-source issue.

## Useful troubleshooting

- **Ollama connection refused:** start the Ollama app/service and confirm port 11434.
- **Embedding model missing:** run ollama pull nomic-embed-text.
- **Gemini gateway connection refused:** start your gateway and check its port/base path.
- **Unknown model:** set GEMINI_MODEL to an ID returned by the gateway; the gateway may not expose every public Gemini model.
- **Unexpected Supabase/Voyage mode:** change the active values in .env and inspect process-level variables such as $env:VECTOR_STORE_BACKEND, $env:EMBEDDING_PROVIDER, and $env:EMBEDDING_MODEL.
- **Scanned/image-only PDFs:** install Tesseract OCR on Windows and set TESSERACT_CMD if it is not installed at C:\Program Files\Tesseract-OCR\tesseract.exe.
- **Empty answers:** ensure documents were indexed successfully and python scripts/check_local_setup.py passes.

The local Chroma collection is tied to its embedding model. Re-embed the documents if you change the local embedding model or embedding dimensions. Do not reuse a collection built with Voyage embeddings for Ollama embeddings.

## Security and retrieval note

accessible_document_ids is an existing retrieval filter, not an identity system. An empty list currently means no additional document-ID restriction in the AI service. A web backend must calculate allowed document IDs server-side and must not call this service with an empty list when the user is allowed to see no documents.
