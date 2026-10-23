# CampusGPT

CampusGPT is a role-aware university information assistant built with a React frontend, a Node.js/Express backend, MongoDB, and a FastAPI retrieval-augmented generation (RAG) service.

**The generation provider in this setup is Gemini Web2API.** Ollama creates embeddings locally; ChromaDB stores vectors. The browser talks to the Node backend, not directly to the AI service or Gemini gateway.

## Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Windows local setup](#windows-local-setup)
- [MongoDB configuration](#mongodb-configuration)
- [Gemini Web2API setup](#gemini-web2api-setup)
- [AI service setup](#ai-service-setup)
- [Backend setup](#backend-setup)
- [Administrator bootstrap and sample documents](#administrator-bootstrap-and-sample-documents)
- [Frontend setup](#frontend-setup)
- [Upload and query your own documents](#upload-and-query-your-own-documents)
- [Docker Compose setup](#docker-compose-setup)
- [Tests and verification](#tests-and-verification)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

## Architecture

| Component | Technology | Local address / role |
|---|---|---|
| Frontend | React + Vite | http://localhost:3000 |
| Web backend | Node.js + Express | http://127.0.0.1:4000 |
| Database | MongoDB | Local instance or remote URI |
| AI service | FastAPI | http://127.0.0.1:8000 |
| Text generation | Gemini Web2API | http://127.0.0.1:8081/v1 |
| Embeddings | Ollama with nomic-embed-text | http://127.0.0.1:11434 |
| Vector database | ChromaDB | ai-services/chroma_db |

### Request flow

1. A user signs in through the frontend and Node backend.
2. The frontend submits chat messages to the backend under /api/v1.
3. The backend authenticates the user and calculates document IDs visible to that role.
4. FastAPI classifies the query, retrieves accessible chunks from ChromaDB, and uses Ollama for query embeddings.
5. The AI service sends grounded document context to Gemini Web2API for answer generation.
6. The backend validates returned sources, stores the conversation in MongoDB, and returns the response.

A successful request to /v1/models does not prove that generation works. Test /v1/chat/completions when configuring Gemini Web2API.

## Prerequisites

For Windows local development, install:

- Git
- Node.js 22 and npm
- Python 3.11
- Ollama for Windows
- MongoDB: a local instance, MongoDB Atlas, or another reachable MongoDB server
- Gemini Web2API, running separately from this repository

For Docker Compose, install Docker Desktop and ensure its engine is running. Gemini Web2API still runs separately on the host.

## Windows local setup

Commands below assume the repository is at D:\Campus. Replace that path if your repository is elsewhere.

### 1. Clone or update the repository

To clone for the first time:

~~~powershell
git clone https://github.com/harshad333-v/CampusGPT.git
cd CampusGPT
git checkout feature/rag-integration
~~~

For an existing clone:

~~~powershell
cd D:\Campus
git switch feature/rag-integration
git pull --ff-only origin feature/rag-integration
~~~

If Git reports that local changes would be overwritten, inspect git status and git diff, then commit or stash intended changes before pulling. Do not use destructive reset/clean commands to bypass the warning.

### 2. Start Ollama and install the embedding model

Install and start Ollama, then run:

~~~powershell
ollama pull nomic-embed-text:latest
ollama list
Test-NetConnection 127.0.0.1 -Port 11434
~~~

The port check should return TcpTestSucceeded: True. CampusGPT uses Ollama for embeddings only; Gemini Web2API generates answers.

## MongoDB configuration

CampusGPT supports either local MongoDB or a remote database.

### Option A: Local MongoDB

Start your MongoDB service and use the local URI in backend/.env:

~~~dotenv
MONGO_URI=mongodb://127.0.0.1:27017/campusgpt
~~~

If the backend reports ECONNREFUSED on port 27017, verify that MongoDB is running and listening on that port.

### Option B: MongoDB Atlas or another remote server

Create a database user, allow your current public IP address in the provider's network access settings, then copy the exact application connection string from your provider. The format commonly looks like this:

~~~dotenv
MONGO_URI=mongodb+srv://DB_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER_HOST/campusgpt?retryWrites=true&w=majority
~~~

The string above is an example template, not a working credential. Use the hostname/options from your provider and URL-encode reserved characters in the password. Do not commit credentials or paste them into an issue.

## Gemini Web2API setup

Gemini Web2API is a separate gateway project, not included in this repository. CampusGPT expects an OpenAI-compatible chat-completions endpoint at /v1/chat/completions.

If you have Gemini Web2API in D:\gemini-web2api, open a dedicated terminal and start it:

~~~powershell
cd D:\gemini-web2api
python gemini_web2api.py --cookie-file .\cookie.txt
~~~

Use the startup command supported by the gateway version you installed. If cookie authentication is required, create cookie.txt locally in the format documented by the gateway project, using a session belonging to your own Google account. Protect that file like a password. Never commit it, upload it to CampusGPT, or share the cookie values in chat or issue reports.

Gateway project and its configuration options: https://github.com/Sophomoresty/gemini-web2api

Keep the gateway running in its own terminal. For local CampusGPT development, the default settings in ai-services/.env are:

~~~dotenv
GEMINI_BASE_URL=http://127.0.0.1:8081/v1
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=not-needed
~~~

Choose a model ID returned by your gateway's /v1/models endpoint. If you enabled API-key protection in the gateway, set GEMINI_API_KEY to the matching gateway API key. Do not put Google session cookies into GEMINI_API_KEY.

Confirm the model list is reachable:

~~~powershell
Invoke-RestMethod http://127.0.0.1:8081/v1/models
Test-NetConnection 127.0.0.1 -Port 8081
~~~

Then test a real completion. The model-list endpoint alone is not enough:

~~~powershell
$body = @{
    model = "gemini-3.6-flash"
    messages = @(
        @{ role = "user"; content = "Reply with exactly: OK" }
    )
    temperature = 0
    max_tokens = 20
    stream = $false
} | ConvertTo-Json -Depth 5

$timer = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $request = @{
        Uri = "http://127.0.0.1:8081/v1/chat/completions"
        Method = "Post"
        ContentType = "application/json"
        Headers = @{ Authorization = "Bearer not-needed" }
        Body = $body
        TimeoutSec = 200
    }
    $response = Invoke-RestMethod @request
    $timer.Stop()
    Write-Host "Generation succeeded in $([math]::Round($timer.Elapsed.TotalSeconds, 1)) seconds"
    $response.choices[0].message.content
} catch {
    $timer.Stop()
    Write-Host "Generation failed after $([math]::Round($timer.Elapsed.TotalSeconds, 1)) seconds"
    Write-Host $_.Exception.Message
}
~~~

Use the matching Authorization header if you configured a gateway API key. If /v1/models works but this call times out, inspect the Gemini Web2API terminal for upstream, authentication, proxy, or rate-limit errors before debugging the CampusGPT frontend. Loading cookie.txt proves only that the file was read; it does not guarantee successful upstream generation.

## AI service setup

Open a new PowerShell terminal:

~~~powershell
cd D:\Campus\ai-services
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
~~~

Confirm the active settings in ai-services/.env:

~~~dotenv
APP_ENV=development
LOG_LEVEL=INFO

GEMINI_BASE_URL=http://127.0.0.1:8081/v1
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=not-needed

EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text:latest
EMBEDDING_DIMENSIONS=768
OLLAMA_BASE_URL=http://127.0.0.1:11434

VECTOR_STORE_BACKEND=chroma
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=campusgpt
~~~

These are local-development values. Preserve other settings in your existing file, select a model exposed by your gateway, and never commit ai-services/.env.

Create the Python virtual environment, install dependencies, and run the setup checker:

~~~powershell
cd D:\Campus\ai-services
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python scripts/check_local_setup.py
~~~

The checker verifies the configured mode, Ollama reachability and embedding generation, Chroma initialization and collection count, and basic gateway reachability. It does not replace the real chat-completion test in the previous section.

Start FastAPI and keep this terminal open:

~~~powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
~~~

Verify:

~~~powershell
Invoke-RestMethod http://127.0.0.1:8000/health
~~~

Interactive API docs: http://127.0.0.1:8000/docs

## Backend setup

Open another PowerShell terminal:

~~~powershell
cd D:\Campus\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
~~~

Set at least the following in backend/.env:

~~~dotenv
NODE_ENV=development
PORT=4000

MONGO_URI=mongodb://127.0.0.1:27017/campusgpt
JWT_SECRET=REPLACE_WITH_A_NEW_RANDOM_SECRET
JWT_EXPIRES_IN=7d

COOKIE_NAME=campusgpt_session
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

AI_SERVICE_URL=http://127.0.0.1:8000
AI_TIMEOUT_MS=120000
SHARED_DOCUMENTS_DIR=./uploads
MAX_UPLOAD_MB=20
~~~

If you are using MongoDB Atlas or another remote server, replace MONGO_URI with your actual remote URI. Keep optional SMTP settings blank unless you configure password-reset email delivery. Do not commit backend/.env.

Generate a new JWT secret locally:

~~~powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~

Copy the generated value into JWT_SECRET in backend/.env. Do not reuse a secret that was disclosed in a log or chat. To safely check the URI format without printing it:

~~~powershell
node -e "require('dotenv').config({override:true}); const u=process.env.MONGO_URI||''; console.log('MongoDB URI configured:',!!u); console.log('URI scheme valid:',/^mongodb(?:\+srv)?:\/\//.test(u));"
~~~

Install dependencies and run checks:

~~~powershell
cd D:\Campus\backend
npm install
npm run check
npm test
~~~

## Administrator bootstrap and sample documents

Create an administrator once per database. Use your own email and a strong, unique password of at least 12 characters. Run this from D:\Campus\backend:

~~~powershell
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Admin email"
$secure = Read-Host "Admin password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    npm run bootstrap:admin
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
~~~

If the account already exists, the bootstrap command stops without overwriting it.

The AI service must be running before seeding because the backend sends each sample document to the AI service for indexing. Set the email of the existing active admin and run:

~~~powershell
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Existing admin email"
npm run seed:documents
~~~

The seed script registers and indexes its listed sample PDFs from ai-services/data and prints indexed/failed totals. It does not automatically seed arbitrary PDFs that you have uploaded through the UI. The admin email must be set for the seed command, and the account must exist and have the admin role.

Now start the backend and keep the terminal open:

~~~powershell
npm run dev
~~~

Verify its health from another terminal:

~~~powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
~~~

Expected: status ok and database connected.

## Frontend setup

Open another PowerShell terminal:

~~~powershell
cd D:\Campus\frontend
npm install
npm run lint
npm run build
npm run dev
~~~

Open http://localhost:3000. Vite proxies /api calls to http://127.0.0.1:4000. The browser should not call FastAPI, MongoDB, Ollama, ChromaDB, or Gemini Web2API directly.

## Upload and query your own documents

Administrators and permitted teachers can upload PDF or DOCX documents through the frontend. The backend stores document metadata in MongoDB and sends the document for indexing by the AI service.

For reliable retrieval:

1. Wait for the upload and indexing operation to finish. Confirm the document appears in the document list and that the UI did not report an error.
2. Assign the correct document type, visibility, department, semester, and tags where relevant.
3. Ask a concrete question answerable from the document. For a midterm notice, ask for a date, subject, instruction, or timetable detail actually present in the PDF.
4. Confirm the signed-in user can access the document. Students can retrieve PUBLIC documents; teachers can retrieve PUBLIC and TEACHER_ONLY documents; admins can retrieve all active documents.
5. If the information is still not found, inspect backend and AI logs and verify that text can be extracted from the PDF. Scanned/image-only PDFs may need OCR configured.

A non-empty Chroma collection only proves that some chunks exist. It does not prove that a specific upload was indexed successfully or is accessible to the current user.

## Docker Compose setup

Docker Compose is the recommended path for a new developer who wants to run CampusGPT without separately installing Node.js, Python, MongoDB, or Ollama on the host. Install **Git** and **Docker Desktop** only; Docker builds the application images and runs MongoDB, Ollama, ChromaDB, FastAPI, the Node backend, and the frontend in containers.

**Important external dependency:** the current generation provider, Gemini Web2API, is not part of this repository or Compose stack. You must run your own OpenAI-compatible Gemini gateway on the host (default port 8081), or change `GEMINI_BASE_URL` and `GEMINI_MODEL` in `.env.fullstack` to point to a compatible gateway. The gateway must support `POST /v1/chat/completions`. Keep its authentication/cookie material private. The app can start without a working gateway, but AI-generated answers will not work until generation succeeds.

### Fast setup on Windows

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Git](https://git-scm.com/downloads). Start Docker Desktop and wait until its engine is running.
2. Clone this repository and enter its root folder:

   ~~~powershell
   git clone https://github.com/harshad333-v/CampusGPT.git
   cd CampusGPT
   git switch feature/rag-integration
   ~~~

3. Start/configure your Gemini-compatible gateway. The default Compose URL is `http://host.docker.internal:8081/v1`; check that `/v1/chat/completions` works before expecting chat answers.
4. Run the setup helper. It creates `.env.fullstack` if missing, generates a unique JWT secret, checks Docker, validates Compose configuration, then builds and starts the containers:

   ~~~powershell
   .\scripts\setup_docker.ps1
   ~~~

   If PowerShell blocks local scripts, run this once in the current PowerShell process and retry:

   ~~~powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\setup_docker.ps1
   ~~~

5. Open the app at **http://localhost:5173**. The first run may take several minutes while Docker downloads images and Ollama downloads the embedding model.
6. Create an administrator and optionally index the sample documents using the commands in the bootstrap section below.

Do not share or commit `.env.fullstack`. It contains a unique JWT secret and may contain gateway credentials. If you want to change gateway settings, edit `.env.fullstack` and restart the stack:

~~~powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up -d
~~~

### Manual setup / other operating systems

The same Compose file works on systems supported by Docker Desktop or Docker Engine with the Compose plugin. Create the environment file and a secret:

~~~bash
cp .env.fullstack.example .env.fullstack
# Generate a secret, then paste it as JWT_SECRET in .env.fullstack:
openssl rand -hex 48
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml config --quiet
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up --build -d
~~~

On Windows PowerShell, use `Copy-Item .env.fullstack.example .env.fullstack` instead of `cp`. Replace the example JWT secret before starting. Set `GEMINI_BASE_URL` to an address reachable **from inside the AI container**. For Docker Desktop on Windows/macOS, `host.docker.internal` is normally the host address; on native Linux, configure a reachable host/gateway address for your environment.

### Container operations

~~~powershell
# View status and health
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml ps

# Follow logs
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml logs -f

# Follow one service
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml logs -f ai-service

# Restart after changing environment settings
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up -d

# Stop containers while preserving databases, vector index, model cache, and uploads
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml down
~~~

Do **not** use `down -v` unless you intentionally want to delete the named volumes, including MongoDB data, Chroma vectors, Ollama model downloads, and uploaded documents.


### 1. Configure Compose environment

From the repository root:

~~~powershell
Copy-Item .env.fullstack.example .env.fullstack
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
notepad .env.fullstack
~~~

Replace JWT_SECRET with the newly generated value. Keep GEMINI_BASE_URL as http://host.docker.internal:8081/v1 for Docker Desktop on Windows. GEMINI_MODEL must be listed by your gateway. Never commit .env.fullstack.

### 2. Start services

~~~powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml up --build -d
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml ps
~~~

First startup can take time while Docker downloads images and Ollama pulls nomic-embed-text. Follow logs:

~~~powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml logs -f mongo ollama ai-service backend frontend
~~~

### 3. Bootstrap admin and seed sample documents

The following commands prompt for a private password and pass it to the one-off bootstrap container. Run them from the repository root:

~~~powershell
$compose = @("--env-file", ".env.fullstack", "-f", "docker-compose.fullstack.yml")
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Admin email"
$secure = Read-Host "Admin password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    docker compose @compose exec -e "BOOTSTRAP_ADMIN_EMAIL=$env:BOOTSTRAP_ADMIN_EMAIL" -e "BOOTSTRAP_ADMIN_PASSWORD=$env:BOOTSTRAP_ADMIN_PASSWORD" backend npm run bootstrap:admin
    if ($LASTEXITCODE -eq 0) {
        docker compose @compose exec -e "BOOTSTRAP_ADMIN_EMAIL=$env:BOOTSTRAP_ADMIN_EMAIL" backend npm run seed:documents
    }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
~~~

If the admin already exists, do not bootstrap a duplicate. For seeding later, set BOOTSTRAP_ADMIN_EMAIL to the existing active admin and run:

~~~powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml exec -e "BOOTSTRAP_ADMIN_EMAIL=$env:BOOTSTRAP_ADMIN_EMAIL" backend npm run seed:documents
~~~

### 4. Open the app

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health
- Frontend proxy health: http://localhost:5173/api/health

The AI service is private to the Compose network. Within the AI container, 127.0.0.1 refers to that container, so the gateway URL must point to the Windows host with host.docker.internal.

Stop the containers while preserving stored data:

~~~powershell
docker compose --env-file .env.fullstack -f docker-compose.fullstack.yml down
~~~

Do not add -v unless you intend to delete MongoDB, ChromaDB, Ollama model data, and uploaded document volumes.

## Tests and verification

Run the relevant tests from each service folder.

Backend:

~~~powershell
cd D:\Campus\backend
npm run check
npm test
~~~

Frontend:

~~~powershell
cd D:\Campus\frontend
npm run lint
npm run build
~~~

AI service:

~~~powershell
cd D:\Campus\ai-services
.\.venv\Scripts\Activate.ps1
python -m pytest -v
python scripts/check_local_setup.py
~~~

The repository includes an end-to-end checker. Run it after the relevant services are running:

~~~powershell
cd D:\Campus
.\scripts\verify_fullstack.ps1
~~~

For an authenticated login → chat session → backend → AI → grounded answer/source check:

~~~powershell
.\scripts\verify_fullstack.ps1 -ChatSmokeTest -LoginEmail admin@your-college.edu
~~~

The checker prompts for the password securely and does not print the access token. Its default question depends on the bundled Raksha Bandhan sample notice being indexed and visible to that account.

For Docker Compose, where the AI port is intentionally private:

~~~powershell
.\scripts\verify_fullstack.ps1 -FrontendUrl http://127.0.0.1:5173 -BackendUrl http://127.0.0.1:4000 -SkipAIHealth -ChatSmokeTest -LoginEmail admin@your-college.edu
~~~

Also sign in separately as an admin, teacher, and student. Test questions covered by indexed documents, check returned sources, verify students cannot retrieve TEACHER_ONLY documents, and test upload, metadata update, and deletion of a PDF/DOCX.

## Troubleshooting

| Problem | What to check |
|---|---|
| Backend reports MongoDB connection refused | Check MONGO_URI and database reachability. For local MongoDB, check port 27017; for Atlas, check IP access list, DB user, credentials, and hostname. |
| Invalid MongoDB URI scheme | URI must begin with mongodb:// or mongodb+srv://. Remove placeholders and check for duplicate or malformed environment settings. |
| JWT_SECRET validation fails | Generate a new random value of at least 32 characters and set it in backend/.env. Never reuse a secret exposed in a log or chat. |
| Gemini /v1/models works but chat times out | Test /v1/chat/completions directly and inspect the Gemini Web2API terminal. The model list does not prove answer generation works. Check upstream errors, authentication, proxy, and rate-limit messages. |
| WinError 10053 from Gemini Web2API | A client connection was aborted. It may follow a client timeout; compare request timing with the gateway's upstream timeout and inspect nearby gateway log entries. |
| Ollama is unavailable | Start Ollama, check port 11434, run ollama list, and pull nomic-embed-text:latest if missing. |
| AI says it cannot find information | Verify that the specific document was indexed, ask about information actually written in the file, check visibility/role access, and inspect backend and AI logs. |
| Uploaded PDF does not answer questions | Confirm upload/indexing completed without error; check its document type, department/semester, visibility, extractable text, and indexing logs. Scanned PDFs may need OCR. |
| Admin works but student cannot retrieve a file | Student queries only see PUBLIC documents; teachers can see PUBLIC and TEACHER_ONLY; admins can see all active documents. |
| Docker reports JWT_SECRET is unset | Ensure .env.fullstack exists and contains a non-placeholder secret; pass it using --env-file .env.fullstack. |
| Docker cannot pull images or reports missing credential helper | Start or repair Docker Desktop and its CLI credential helper. This is a Docker installation/configuration problem, separate from CampusGPT. |
| Git pull refuses because local files changed | Inspect git status, git diff, and git diff --cached. Commit or stash intended edits before pulling; avoid destructive reset/clean commands. |

## Security notes

- Never commit .env, .env.local, .env.fullstack, cookie.txt, exported browser cookies, JWT secrets, database credentials, API keys, or private documents.
- Gemini Web2API is a separate community gateway to the Gemini web interface, not the official Gemini API. Its availability, upstream behavior, authentication, and model names can change. Keep it local/private, respect provider terms/rate limits, and protect its cookie file like a password.
- A startup message saying a cookie file was loaded does not guarantee upstream authentication or successful generation. Test /v1/chat/completions.
- Keep the AI service, MongoDB, Ollama, ChromaDB, and Gemini Web2API on local/private interfaces and networks. The browser should communicate only with the Node backend.
- Backend role/document authorization is the security boundary; frontend route guards alone are not sufficient.