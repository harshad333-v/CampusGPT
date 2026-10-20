# Local AI and RAG development on Windows

This is the supported local profile for development: **Ollama embeddings + ChromaDB vectors + Gemini Web API generation**. The NLP pipeline and existing FastAPI endpoints are unchanged.

## 1. Prepare Python dependencies

Run PowerShell from ai-services:

~~~powershell
.\scripts\setup_local.ps1
~~~

Activate the virtual environment:

~~~powershell
.\.venv\Scripts\Activate.ps1
~~~

In PyCharm, configure the project interpreter as ai-services\.venv\Scripts\python.exe.

## 2. Confirm the local environment file

The setup script creates ai-services/.env only if it does not already exist. It deliberately does not overwrite an existing file.

For this profile, verify these settings in .env:

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

If your current .env uses Supabase/Voyage, back it up before changing it. From ai-services, for example:

~~~powershell
Copy-Item .env .env.supabase-backup
~~~

Then edit .env manually to use the local values above. Do not put database passwords or provider keys in Git.

Windows environment variables override values loaded from .env. To inspect the common provider overrides in the current terminal without printing secrets:

~~~powershell
Get-ChildItem Env:VECTOR_STORE_BACKEND,Env:EMBEDDING_PROVIDER,Env:EMBEDDING_MODEL,Env:OLLAMA_BASE_URL -ErrorAction SilentlyContinue
~~~

To remove a stale override from just the current PowerShell session, for example:

~~~powershell
Remove-Item Env:VECTOR_STORE_BACKEND -ErrorAction SilentlyContinue
Remove-Item Env:EMBEDDING_PROVIDER -ErrorAction SilentlyContinue
Remove-Item Env:EMBEDDING_MODEL -ErrorAction SilentlyContinue
Remove-Item Env:OLLAMA_BASE_URL -ErrorAction SilentlyContinue
~~~

## 3. Start local embeddings

Install Ollama for Windows and start it. Then:

~~~powershell
ollama pull nomic-embed-text
ollama list
Invoke-RestMethod http://127.0.0.1:11434/api/tags
~~~

The configured embedding model should appear in the model list. CampusGPT sends text to Ollama to calculate vector embeddings on your computer.

## 4. Start the Gemini Web API gateway

In a separate terminal, start your existing Gemini Web API gateway. CampusGPT uses the OpenAI-compatible ChatOpenAI client, so the gateway must accept POST /v1/chat/completions. The default configured base URL is http://127.0.0.1:8081/v1.

~~~powershell
Invoke-RestMethod http://127.0.0.1:8081/v1/models
~~~

A gateway that does not implement GET /v1/models can still be reachable; check its documented chat endpoint and the gateway logs. Set GEMINI_BASE_URL and GEMINI_MODEL to match your running server.

## 5. Validate the services

~~~powershell
python scripts/check_local_setup.py
~~~

This checks that the selected backends are local, probes Ollama, confirms the embedding model is installed, performs an embedding smoke test, initializes/reads the local Chroma collection, and probes the configured Gemini gateway. It never prints API keys or database credentials.

Use --skip-embedding-test to check reachability without computing a test vector, or --skip-gemini-check if the gateway is not started yet.

## 6. Build/update the local vector index

Dry run first:

~~~powershell
python scripts/ingest_directory.py --directory data --dry-run
~~~

Then ingest:

~~~powershell
python scripts/ingest_directory.py --directory data
~~~

The script finds PDF/DOCX files recursively. PDFs are read locally; scanned pages can use Tesseract OCR if installed. The script uses stable IDs, upserts current chunks, then deletes only stale chunks belonging to that same document. Other documents in the collection are preserved.

The sample timetable retains document_id=test-btech-v-b-001, which matches the existing API tests. Additional files get stable local IDs based on their relative paths.

The vector index is stored under ai-services/chroma_db/ by default. It is local runtime data and should not be committed to Git.

## 7. Run automated tests and the API

~~~powershell
python -m pytest -v
python -m uvicorn app.main:app --reload
~~~

Health check: http://127.0.0.1:8000/health  
Swagger UI: http://127.0.0.1:8000/docs

The current API tests that ask grounded document questions expect the sample corpus to have been ingested. Run the ingestion step first. Those tests may also call the configured Gemini gateway for answer generation, so that gateway must be running for the full end-to-end test suite.

## 8. Document formats and OCR

PDF and DOCX are supported. Tesseract OCR is an optional system dependency for image-only/scanned PDFs; pytesseract alone does not install the Tesseract engine. For a standard Windows installation the executable is often at:

~~~text
C:\Program Files\Tesseract-OCR\tesseract.exe
~~~

Set TESSERACT_CMD in .env if your installation uses another path.

## Data profile warning

ChromaDB local data and model embeddings must remain compatible. If you switch from a different embedding provider/model, create a fresh collection or re-ingest the complete corpus with the chosen model. The local profile avoids Supabase and Voyage at runtime; the optional Supabase/Voyage code remains available but is not part of the local workflow.
