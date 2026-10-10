# CampusGPT AI Service

AI and RAG microservice for the CampusGPT university assistant.

This service is responsible for document processing, NLP-based query analysis, retrieval, access-controlled RAG, conversation context, and local LLM answer generation.

---

## 1. Overview

CampusGPT AI Service provides the AI layer for the CampusGPT application.

It uses:

- FastAPI for the HTTP API
- LangChain for the RAG pipeline
- ChromaDB for vector storage
- Ollama for local LLM inference
- Qwen3 4B for answer generation
- `nomic-embed-text` for embeddings
- PyPDF / PDFium / python-docx for document processing

The AI service is designed to work with the existing Node/Express backend.

---

## 2. Responsibilities

### AI Service owns

- Query normalization
- Query classification
- Entity extraction
- Query routing
- PDF/DOCX document loading
- Timetable parsing
- Metadata enrichment
- Text chunking
- Embeddings
- ChromaDB vector storage
- Metadata-based retrieval
- Access-controlled document retrieval
- RAG context construction
- Local LLM generation
- Conversation context
- Grounding checks
- Source metadata

### Node/Express backend owns

- Authentication
- User management
- Database
- Document ownership
- Authorization decisions
- User/document relationships
- Backend business logic
- Frontend integration

The backend sends the AI service the document IDs that the current user is allowed to access.

---

## 3. Architecture

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node/Express      │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                         POST /v1/chat
                               │
                               ▼
              ┌────────────────────────────────┐
              │       CampusGPT AI Service     │
              │                                │
              │  ┌──────────────────────────┐  │
              │  │       NLP Pipeline       │  │
              │  └────────────┬─────────────┘  │
              │               │                │
              │  ┌────────────▼─────────────┐  │
              │  │    Query Routing         │  │
              │  └────────────┬─────────────┘  │
              │               │                │
              │  ┌────────────▼─────────────┐  │
              │  │ Access-Controlled        │  │
              │  │ Retrieval                │  │
              │  └────────────┬─────────────┘  │
              │               │                │
              │  ┌────────────▼─────────────┐  │
              │  │ Context Builder           │  │
              │  └────────────┬─────────────┘  │
              │               │                │
              │  ┌────────────▼─────────────┐  │
              │  │ Qwen3 4B via Ollama       │  │
              │  └────────────┬─────────────┘  │
              │               │                │
              │               ▼                │
              │        Answer + Sources        │
              └────────────────────────────────┘


# RAG Pipeline

User Query
    │
    ▼
NLP Analysis
    │
    ├── Language
    ├── Query Type
    ├── Intent
    └── Entities
    │
    ▼
Query Router
    │
    ▼
Metadata Filters
    │
    ▼
Access-Controlled Retrieval
    │
    ▼
ChromaDB
    │
    ▼
Relevant Documents
    │
    ▼
Context Builder
    │
    ▼
Qwen3 4B
    │
    ▼
Grounded Answer
    │
    ▼
Sources

# Project Structure

ai-services/
│
├── app/
│   ├── api/
│   │   ├── chat.py
│   │   └── documents.py
│   │
│   ├── core/
│   │
│   ├── models/
│   │   ├── chat.py
│   │   └── documents.py
│   │
│   ├── nlp/
│   │   ├── classifier.py
│   │   ├── entity_extractor.py
│   │   ├── normalizer.py
│   │   ├── router.py
│   │   ├── schemas.py
│   │   └── service.py
│   │
│   ├── rag/
│   │   ├── loaders/
│   │   ├── preprocessors/
│   │   ├── chunker.py
│   │   ├── context_builder.py
│   │   ├── embeddings.py
│   │   ├── generator.py
│   │   ├── ingestion.py
│   │   ├── pipeline.py
│   │   ├── retriever.py
│   │   └── vector_store.py
│   │
│   └── main.py
│
├── data/
│   └── Sample/test college documents
│
├── scripts/
│   ├── ingest_documents.py
│   ├── test_chunker.py
│   ├── test_conversation.py
│   ├── test_ingestion.py
│   ├── test_loader.py
│   ├── test_metadata_retrieval.py
│   ├── test_nlp.py
│   ├── test_preprocessor.py
│   ├── test_rag.py
│   ├── test_retrieval.py
│   ├── test_retrieval_scores.py
│   └── test_timetable_parser.py
│
├── tests/
│   └── test_api.py
│
├── .gitignore
├── README.md
└── requirements.txt

# Requirements
Software
Python 3.11+
Ollama
Git
Python

Install dependencies:

python -m venv .venv

Activate the environment on Windows:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt
7. Ollama Setup

Install Ollama on the development machine.

Pull the generation model:

ollama pull qwen3:4b

Pull the embedding model:

ollama pull nomic-embed-text

Check installed models:

ollama list

The service currently expects Ollama at:

http://127.0.0.1:11434

If required in PowerShell:

$env:OLLAMA_HOST="127.0.0.1:11434"
8. Models
Generation
Qwen3 4B

Configured in:

app/rag/generator.py
Embeddings
nomic-embed-text

Configured in:

app/rag/vector_store.py
9. Vector Database

The service uses:

ChromaDB

The local vector database is stored in:

chroma_db/

chroma_db/ is intentionally excluded from Git.

Each developer should generate their own local vector database by ingesting the documents.

10. Document Ingestion

Documents can be ingested through the API:

POST /v1/documents/ingest

The ingestion pipeline performs:

PDF / DOCX
    ↓
Document Loader
    ↓
Timetable Parser (when applicable)
    ↓
Metadata Enrichment
    ↓
Chunking
    ↓
Embeddings
    ↓
ChromaDB

The service currently supports:

PDF
DOCX
11. API Endpoints

The public AI service endpoints are:

GET    /health

POST   /v1/documents/ingest

DELETE /v1/documents/{document_id}

POST   /v1/chat
12. Health Check
Request
GET /health
Response
{
  "status": "ok",
  "service": "campusgpt-ai",
  "version": "1.0.0"
}
13. Chat API
Endpoint
POST /v1/chat
Request
{
  "message": "When is the Raksha Bandhan holiday?",
  "conversation": [],
  "user_context": null,
  "accessible_document_ids": []
}
Conversation format
[
  {
    "role": "user",
    "content": "Who teaches DSA?"
  },
  {
    "role": "assistant",
    "content": "Dr. Aravendra Kumar Sharma teaches DSA."
  }
]

The conversation history is used to help the model understand follow-up questions.

Retrieved college documents remain the factual source.

Access-controlled retrieval

The backend can provide:

{
  "accessible_document_ids": [
    "document-001",
    "document-002"
  ]
}

The AI service will restrict retrieval to those documents.

This allows the backend to control which documents the user is allowed to access.

Response
{
  "answer": "9:20 - 11:00 in MG-513 Lab",
  "sources": [
    {
      "document_id": "test-btech-v-b-001",
      "title": "B.Tech V(B) Timetable",
      "page": 2
    }
  ],
  "query_type": "DOCUMENT",
  "grounded": true
}
14. Document Ingestion API
Endpoint
POST /v1/documents/ingest
Example request
{
  "document_id": "test-btech-v-b-001",
  "title": "B.Tech V(B) Timetable",
  "file_path": "D:\\CampusGPT\\ai-services\\data\\B.Tech-V(B).pdf",
  "document_type": "TIMETABLE",
  "department": "CSE",
  "semester": 5,
  "visibility": "PUBLIC",
  "tags": [
    "timetable",
    "CSE",
    "semester-5"
  ]
}
Response
{
  "success": true,
  "document_id": "test-btech-v-b-001",
  "chunks_created": 20
}
15. Delete Document API
Endpoint
DELETE /v1/documents/{document_id}

Example:

DELETE /v1/documents/test-btech-v-b-001
Response
{
  "success": true,
  "document_id": "test-btech-v-b-001",
  "chunks_deleted": 20
}
16. Running the Service

From the ai-services directory:

.\.venv\Scripts\Activate.ps1

Start FastAPI:

uvicorn app.main:app --reload

The service will normally be available at:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs
17. Running Tests

Run the complete test suite:

python -m pytest -v

Current API test coverage includes:

Health endpoint
Greeting handling
Unsupported queries
Authorized document retrieval
Unauthorized document blocking
Multiple authorized documents
Empty access list
Empty message validation

The current baseline is:

8 passed
18. Sample Data

The data/ directory contains sample college documents used for development and RAG testing.

The local ChromaDB is not stored in Git.

To recreate the vector database, ingest the sample documents again.

19. Backend Integration

The Node/Express backend should communicate with this service through the documented API.

For chat:

Frontend
   ↓
Node/Express Backend
   ↓
POST /v1/chat
   ↓
CampusGPT AI Service
   ↓
RAG
   ↓
Response
   ↓
Node/Express Backend
   ↓
Frontend

The backend should provide the document IDs the current user is allowed to access:

{
  "accessible_document_ids": [
    "document-001",
    "document-002"
  ]
}

The AI service should not be treated as the system of record for users or permissions.

20. Important Development Notes
Do not commit
.venv/
.idea/
chroma_db/
.env
__pycache__/
.pytest_cache/
Do commit
app/
scripts/
tests/
data/
requirements.txt
README.md
.gitignore
Local vector database

Each developer should create their own:

chroma_db/

by running document ingestion.

Ollama

Ollama must be installed and running locally.

21. Current Status
Completed
NLP pipeline
Query classification
Entity extraction
Query routing
PDF/DOCX loading
Timetable parsing
Metadata enrichment
Chunking
Vector storage
Metadata filtering
Access-controlled retrieval
RAG context construction
Qwen3 4B generation
Conversation context
FastAPI API
Document ingestion API
Document deletion API
API automated tests
Planned improvements
Conversation-aware query rewriting
More advanced user-context filtering
Improved generic-query relevance detection
RAG evaluation metrics
Production logging and monitoring
Additional automated tests
22. Quick Start
# Clone repository
git clone <repository-url>

# Enter AI service
cd CampusGPT\ai-services

# Create environment
python -m venv .venv

# Activate environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start Ollama models
ollama pull qwen3:4b
ollama pull nomic-embed-text

# Run tests
python -m pytest -v

# Start API
uvicorn app.main:app --reload

API:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

Save the file.

### One correction before we commit

I intentionally documented your **current actual setup**:

```text
Generation → qwen3:4b
Embeddings → nomic-embed-text