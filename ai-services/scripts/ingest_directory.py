"""Recursively embed PDF/DOCX files into the configured local Chroma collection."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from app.core.config import get_settings
from app.rag.ingestion import ingest_document, infer_document_type
from app.rag.vector_store import get_vector_store

from scripts.local_indexing import metadata_for_file, replace_document_vectors


SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Recursively ingest local PDF and DOCX files using Ollama + Chroma."
    )
    parser.add_argument(
        "--directory",
        default=str(AI_ROOT / "data"),
        help="Folder containing PDFs/DOCX files (default: ai-services/data).",
    )
    parser.add_argument("--document-type", default=None, help="Override type for every file, e.g. NOTICE.")
    parser.add_argument("--department", default=None, help="Optional department metadata.")
    parser.add_argument("--semester", type=int, default=None, help="Optional semester metadata.")
    parser.add_argument("--visibility", default="PUBLIC", choices=["PUBLIC", "PRIVATE"])
    parser.add_argument("--tag", action="append", default=[], help="Optional tag; may be repeated.")
    parser.add_argument("--dry-run", action="store_true", help="List files without embedding or writing vectors.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = get_settings()

    if settings.vector_store_backend != "chroma" or settings.embedding_provider != "ollama":
        print(
            "This importer is for the local profile only. Set "
            "VECTOR_STORE_BACKEND=chroma and EMBEDDING_PROVIDER=ollama in ai-services/.env."
        )
        return 2

    root = Path(args.directory).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"Directory not found: {root}")
        return 2

    files = sorted(
        path for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    if not files:
        print(f"No PDF or DOCX files found under: {root}")
        return 0

    print(f"Directory: {root}")
    print(f"Vector store: Chroma collection '{settings.chroma_collection_name}'")
    print(f"Files found: {len(files)}")
    for path in files:
        print(f"  - {path.relative_to(root).as_posix()}")
    if args.dry_run:
        print("Dry run complete; nothing was embedded or changed.")
        return 0

    vector_store = get_vector_store()
    successful = 0
    failed = 0
    total_chunks = 0

    for path in files:
        try:
            metadata = metadata_for_file(path, root)
            document_type = args.document_type or metadata.get("document_type") or infer_document_type(path.name)
            department = args.department or metadata.get("department")
            semester = args.semester if args.semester is not None else metadata.get("semester")
            tags = list(dict.fromkeys([*metadata.get("tags", []), *args.tag]))

            chunks = ingest_document(
                file_path=str(path),
                document_id=metadata["document_id"],
                title=metadata["title"],
                document_type=document_type,
                department=department,
                semester=semester,
                visibility=args.visibility,
                tags=tags,
            )
            if not chunks:
                raise ValueError("No text or timetable records were extracted.")

            chunk_count = replace_document_vectors(
                vector_store, metadata["document_id"], chunks
            )
            successful += 1
            total_chunks += chunk_count
            print(f"[OK] {path.name}: {chunk_count} chunks (id={metadata['document_id']})")
        except Exception as error:
            failed += 1
            print(f"[FAILED] {path.name}: {error}")

    print(f"Finished. Files succeeded: {successful}; failed: {failed}; chunks indexed: {total_chunks}.")
    print(f"Chroma data is persistent under: {AI_ROOT / settings.chroma_persist_directory}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
