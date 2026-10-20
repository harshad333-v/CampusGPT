"""Read-only audit of the local Chroma index; this script never deletes data."""

from __future__ import annotations

import argparse
from collections import defaultdict
import re
import sys
from typing import Any

AI_ROOT = __import__("pathlib").Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from app.core.config import get_settings
from app.rag.vector_store import get_vector_store


def normalize_text(value: str) -> str:
    """Normalize whitespace and case for exact-text duplicate checks."""
    return re.sub(r"\s+", " ", value).strip().casefold()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Inspect Chroma document IDs, titles, chunk counts, and exact duplicate "
            "chunks. This command is read-only."
        )
    )
    parser.add_argument(
        "--match",
        default=None,
        help="Optional case-insensitive filter for ID, title, filename, or chunk text.",
    )
    parser.add_argument(
        "--show-snippets",
        action="store_true",
        help="Print a short text excerpt for each matched document (off by default).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = get_settings()

    if settings.vector_store_backend != "chroma":
        print(
            "This audit script requires VECTOR_STORE_BACKEND=chroma. "
            "No data was changed."
        )
        return 2

    store = get_vector_store()
    result = store.get(include=["metadatas", "documents"])
    ids = result.get("ids") or []
    metadatas = result.get("metadatas") or [{} for _ in ids]
    documents = result.get("documents") or ["" for _ in ids]

    by_document: dict[str, dict[str, Any]] = {}
    exact_chunks: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"document_ids": set(), "count": 0, "snippet": ""}
    )
    match_term = args.match.casefold() if args.match else None

    for vector_id, metadata, document_text in zip(ids, metadatas, documents):
        metadata = metadata or {}
        document_text = document_text or ""
        document_id = str(metadata.get("document_id") or "(missing document_id)")
        title = str(metadata.get("title") or "(untitled)")
        filename = str(metadata.get("file_name") or metadata.get("source") or "(unknown file)")
        searchable = " ".join([document_id, title, filename, document_text]).casefold()

        normalized = normalize_text(document_text)
        if normalized:
            fingerprint = normalized
            exact_chunks[fingerprint]["document_ids"].add(document_id)
            exact_chunks[fingerprint]["count"] += 1
            if not exact_chunks[fingerprint]["snippet"]:
                exact_chunks[fingerprint]["snippet"] = re.sub(r"\s+", " ", document_text).strip()[:180]

        if match_term and match_term not in searchable:
            continue

        entry = by_document.setdefault(
            document_id,
            {
                "count": 0,
                "titles": set(),
                "filenames": set(),
                "ids": [],
                "snippets": [],
            },
        )
        entry["count"] += 1
        entry["titles"].add(title)
        entry["filenames"].add(filename)
        entry["ids"].append(str(vector_id))
        if document_text.strip() and len(entry["snippets"]) < 2:
            entry["snippets"].append(re.sub(r"\s+", " ", document_text).strip()[:180])

    print(f"Chroma collection: {settings.chroma_collection_name}")
    print(f"Persist directory: {settings.chroma_persist_directory}")
    print(f"Total chunks in collection: {len(ids)}")
    print(f"Document IDs shown: {len(by_document)}")
    if match_term:
        print(f"Filter: {args.match!r}")
    print("\nDocument inventory:")
    if not by_document:
        print("  No matching records.")
    for document_id, entry in sorted(by_document.items()):
        titles = " | ".join(sorted(entry["titles"]))
        filenames = " | ".join(sorted(entry["filenames"]))
        print(f"  - ID: {document_id}")
        print(f"    chunks: {entry['count']}")
        print(f"    title: {titles}")
        print(f"    file: {filenames}")
        if args.show_snippets:
            for snippet in entry["snippets"]:
                print(f"    snippet: {snippet}")

    duplicates = [
        (text_value, details)
        for text_value, details in exact_chunks.items()
        if len(details["document_ids"]) > 1
    ]
    print("\nExact-text chunks repeated across different document IDs:")
    if not duplicates:
        print("  None found.")
    else:
        for _, details in sorted(duplicates, key=lambda item: (-len(item[1]["document_ids"]), item[0])):
            ids_text = ", ".join(sorted(details["document_ids"]))
            print(f"  - document IDs: {ids_text}; occurrences: {details['count']}")
            if args.show_snippets:
                print(f"    snippet: {details['snippet']}")

    print("\nRead-only audit complete. No vectors or metadata were changed.")
    print(
        "Review IDs, titles, filenames, and source content before removing anything; "
        "different IDs can represent intentionally separate documents."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
