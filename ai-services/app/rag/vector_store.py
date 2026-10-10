from hashlib import sha256
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

CHROMA_DIR = PROJECT_ROOT / "chroma_db"

COLLECTION_NAME = "campusgpt"

EMBEDDING_MODEL = "nomic-embed-text:latest"


# ---------------------------------------------------------
# Embeddings
# ---------------------------------------------------------

def get_embeddings():
    """
    Return the local Ollama embedding model.
    """

    return OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url="http://127.0.0.1:11434",
    )


# ---------------------------------------------------------
# Stable Document IDs
# ---------------------------------------------------------

def generate_document_id(document: Document) -> str:
    """
    Generate a deterministic ID for a document chunk.

    The ID is based on the source file and chunk content.
    The same source + content will always produce the same ID.
    """

    source = str(document.metadata.get("source", ""))

    content = document.page_content.strip()

    raw_id = f"{source}|{content}"

    return sha256(
        raw_id.encode("utf-8")
    ).hexdigest()


def generate_document_ids(
    documents: list[Document],
) -> list[str]:
    """
    Generate stable IDs for multiple document chunks.
    """

    return [
        generate_document_id(document)
        for document in documents
    ]


# ---------------------------------------------------------
# Vector Store
# ---------------------------------------------------------

def get_vector_store():
    """
    Return the persistent ChromaDB vector store.
    """

    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=str(CHROMA_DIR),
    )