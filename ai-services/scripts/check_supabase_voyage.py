"""Manual integration check for CampusGPT's Supabase + Voyage setup.

Run from ai-services:
    python -m scripts.check_supabase_voyage

This performs read-only database checks, generates one query embedding, ensures
the LangChain collection exists, and issues a vector search. It does not ingest,
delete, or rewrite document chunks, and never prints secret values.
"""

from __future__ import annotations


from sqlalchemy import text

from app.core.config import get_settings
from app.rag.vector_store import get_embeddings, get_postgres_engine, get_vector_store


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def main() -> None:
    settings = get_settings()

    if settings.vector_store_backend != "supabase":
        fail("Set VECTOR_STORE_BACKEND=supabase in ai-services/.env.")
    if settings.embedding_provider != "voyage":
        fail("Set EMBEDDING_PROVIDER=voyage in ai-services/.env.")

    print("CampusGPT integration check")
    print(f"  Vector backend: {settings.vector_store_backend}")
    print(f"  Embedding provider: {settings.embedding_provider}")
    print(f"  Embedding model: {settings.embedding_model}")
    print(f"  Expected dimensions: {settings.embedding_dimensions}")
    print("  Credentials: configured (values hidden)")

    # Check Supabase/PostgreSQL and the pre-created vector schema.
    try:
        with get_postgres_engine().connect() as connection:
            info = connection.execute(
                text(
                    """
                    SELECT
                        current_database() AS database_name,
                        current_schema() AS current_schema,
                        current_setting('search_path') AS search_path,
                        (
                            SELECT extversion
                            FROM pg_extension
                            WHERE extname = 'vector'
                        ) AS vector_version,
                        (
                            SELECT format_type(a.atttypid, a.atttypmod)
                            FROM pg_attribute a
                            JOIN pg_class c ON c.oid = a.attrelid
                            JOIN pg_namespace n ON n.oid = c.relnamespace
                            WHERE n.nspname = :schema_name
                              AND c.relname = 'langchain_pg_embedding'
                              AND a.attname = 'embedding'
                              AND NOT a.attisdropped
                        ) AS embedding_type,
                        (
                            SELECT relrowsecurity
                            FROM pg_class c
                            JOIN pg_namespace n ON n.oid = c.relnamespace
                            WHERE n.nspname = :schema_name
                              AND c.relname = 'langchain_pg_embedding'
                        ) AS embedding_rls_enabled
                    """
                ),
                {"schema_name": settings.pgvector_schema_name},
            ).mappings().one()

        if info["current_schema"] != settings.pgvector_schema_name:
            fail(
                "Unexpected PostgreSQL search_path. Expected current schema "
                f"{settings.pgvector_schema_name!r}, found {info['current_schema']!r}."
            )
        if not info["vector_version"]:
            fail("PostgreSQL is reachable, but the pgvector extension is missing.")
        expected_type = f"vector({settings.embedding_dimensions})"
        if info["embedding_type"] != expected_type:
            fail(
                "Embedding column mismatch: expected "
                f"{expected_type}, found {info['embedding_type']!r}. "
                "Check the migration and EMBEDDING_DIMENSIONS."
            )
        if not info["embedding_rls_enabled"]:
            fail("Row-level security is not enabled on the vector table.")

        print("  PostgreSQL connection: OK")
        print(f"  Database: {info['database_name']}")
        print(f"  Current schema: {info['current_schema']}")
        print(f"  pgvector version: {info['vector_version']}")
        print(f"  Embedding column: {info['embedding_type']}")
        print(f"  Vector-table RLS: {info['embedding_rls_enabled']}")
    except SystemExit:
        raise
    except Exception as exc:
        fail(
            "PostgreSQL connection/schema check failed "
            f"({type(exc).__name__}). Check DATABASE_URL, password URL-encoding, "
            "SSL, and the Supabase connection method. Sensitive values were not printed."
        )

    # Only send a short test query to Voyage and validate its output shape.
    try:
        query_embedding = get_embeddings().embed_query(
            "CampusGPT integration test for college notices and syllabus retrieval."
        )
        if len(query_embedding) != settings.embedding_dimensions:
            fail(
                f"Voyage returned {len(query_embedding)} dimensions; expected "
                f"{settings.embedding_dimensions}."
            )
        print(f"  Voyage API: OK ({len(query_embedding)} dimensions)")
    except SystemExit:
        raise
    except Exception as exc:
        fail(
            f"Voyage embedding check failed ({type(exc).__name__}). "
            "Check EMBEDDING_API_KEY, model access, account credits, and rate limits. "
            "Sensitive values were not printed."
        )

    # PGVector initialization is scoped to the configured collection. The first
    # successful run may create a metadata row for this collection; no documents
    # are inserted or deleted.
    try:
        store = get_vector_store()
        matches = store.similarity_search_by_vector(
            query_embedding,
            k=1,
        )
        print("  Supabase pgvector store: OK")
        if matches:
            print(f"  Search query: OK ({len(matches)} result(s) returned)")
        else:
            print("  Search query: OK (no indexed documents yet; this is expected)")
    except Exception as exc:
        fail(f"Vector-store/search check failed: {type(exc).__name__}: {exc}")

    print("\nSUCCESS: Supabase and Voyage are reachable and configuration dimensions match.")
    print("Note: this test does not migrate or index your PDFs.")


if __name__ == "__main__":
    main()
