from functools import lru_cache
from hashlib import sha256
from pathlib import Path

from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import AI_SERVICE_ROOT, get_settings


# ---------------------------------------------------------
# Embeddings
# ---------------------------------------------------------

@lru_cache(maxsize=1)
def get_embeddings():
    """Build the configured embedding client.

    Local Ollama remains the default for backwards-compatible development.
    Select Voyage in the environment for hosted embedding generation.
    """

    settings = get_settings()

    if settings.embedding_provider == "ollama":
        return OllamaEmbeddings(
            model=settings.embedding_model,
            base_url=settings.ollama_base_url,
        )

    if settings.embedding_provider == "voyage":
        from langchain_voyageai import VoyageAIEmbeddings

        if settings.embedding_api_key is None:
            raise RuntimeError(
                "EMBEDDING_API_KEY is required for the Voyage embedding provider."
            )

        return VoyageAIEmbeddings(
            model=settings.embedding_model,
            voyage_api_key=settings.embedding_api_key.get_secret_value(),
            output_dimension=settings.embedding_dimensions,
        )

    raise RuntimeError(
        f"Unsupported embedding provider: {settings.embedding_provider}"
    )


# ---------------------------------------------------------
# Stable Document IDs
# ---------------------------------------------------------

def generate_document_id(document: Document) -> str:
    """Generate a stable ID from the source and chunk content."""

    source = str(document.metadata.get("source", ""))
    content = document.page_content.strip()
    raw_id = f"{source}|{content}"

    return sha256(raw_id.encode("utf-8")).hexdigest()


def generate_document_ids(documents: list[Document]) -> list[str]:
    """Generate stable IDs for multiple document chunks."""

    return [generate_document_id(document) for document in documents]


# ---------------------------------------------------------
# PostgreSQL connection
# ---------------------------------------------------------

def _postgres_connection_url() -> str:
    """Return a SQLAlchemy URL that explicitly uses psycopg 3."""

    settings = get_settings()
    if settings.database_url is None:
        raise RuntimeError(
            "DATABASE_URL is required when VECTOR_STORE_BACKEND=supabase."
        )

    connection_url = settings.database_url.get_secret_value().strip()

    if connection_url.startswith("postgres://"):
        connection_url = "postgresql+psycopg://" + connection_url[len("postgres://"):]
    elif connection_url.startswith("postgresql://"):
        connection_url = "postgresql+psycopg://" + connection_url[len("postgresql://"):]
    elif not connection_url.startswith("postgresql+psycopg://"):
        raise ValueError(
            "DATABASE_URL must use postgres://, postgresql://, "
            "or postgresql+psycopg://."
        )

    return connection_url


@lru_cache(maxsize=1)
def get_postgres_engine() -> Engine:
    """Create one pooled SQLAlchemy engine per application process."""

    settings = get_settings()
    return create_engine(
        _postgres_connection_url(),
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
    )


# ---------------------------------------------------------
# Vector Store
# ---------------------------------------------------------

@lru_cache(maxsize=1)
def get_vector_store():
    """Return the configured vector store behind the existing RAG interface."""

    settings = get_settings()

    if settings.vector_store_backend == "chroma":
        chroma_dir = Path(settings.chroma_persist_directory)
        if not chroma_dir.is_absolute():
            chroma_dir = AI_SERVICE_ROOT / chroma_dir

        chroma_dir.mkdir(parents=True, exist_ok=True)

        return Chroma(
            collection_name=settings.chroma_collection_name,
            embedding_function=get_embeddings(),
            persist_directory=str(chroma_dir),
        )

    if settings.vector_store_backend == "supabase":
        from langchain_postgres import PGVector

        return PGVector(
            collection_name=settings.pgvector_collection_name,
            embeddings=get_embeddings(),
            connection=get_postgres_engine(),
            embedding_length=settings.embedding_dimensions,
            use_jsonb=True,
            create_extension=False,
        )

    raise RuntimeError(
        f"Unsupported vector store backend: {settings.vector_store_backend}"
    )


# ---------------------------------------------------------
# Document deletion (keeps DELETE endpoint contract unchanged)
# ---------------------------------------------------------

def delete_document_chunks(document_id: str) -> int:
    """Delete all chunks for a document using the selected vector backend."""

    settings = get_settings()
    vector_store = get_vector_store()

    if settings.vector_store_backend == "chroma":
        result = vector_store.get(
            where={"document_id": {"$eq": document_id}}
        )
        ids = result.get("ids", [])

        if ids:
            vector_store.delete(ids=ids)

    elif settings.vector_store_backend == "supabase":
        with get_postgres_engine().connect() as connection:
            ids = connection.execute(
                text(
                    """
                    SELECT e.id
                    FROM public.langchain_pg_embedding AS e
                    JOIN public.langchain_pg_collection AS c
                      ON c.uuid = e.collection_id
                    WHERE c.name = :collection_name
                      AND e.cmetadata ->> 'document_id' = :document_id
                    """
                ),
                {
                    "collection_name": settings.pgvector_collection_name,
                    "document_id": document_id,
                },
            ).scalars().all()

        if ids:
            vector_store.delete(ids=list(ids), collection_only=True)

    else:
        raise RuntimeError(
            f"Unsupported vector store backend: {settings.vector_store_backend}"
        )

    return len(ids)
