"""Safely identify and optionally remove orphan Chroma chunks.

Default behavior is a dry run. A chunk is eligible only when it lacks a document_id
and an identical normalized text chunk exists under a valid document_id for the same
source filename, with no metadata conflicts on fields present in both records.
Properly identified document records are never deleted by this script.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys
from typing import Any

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from app.core.config import get_settings
from app.rag.vector_store import get_vector_store


SAFETY_FIELDS = (
    "visibility",
    "document_type",
    "department",
    "semester",
    "tags",
)


def normalize_text(value: str) -> str:
    """Normalize whitespace and case for conservative duplicate matching."""
    return re.sub(r"\s+", " ", value).strip().casefold()


def source_filename(metadata: dict[str, Any]) -> str:
    """Resolve a stable filename key without relying on machine-specific paths."""
    file_name = metadata.get("file_name")
    if not file_name:
        file_name = metadata.get("source")
    if not file_name:
        return ""
    return Path(str(file_name)).name.strip().casefold()


def metadata_compatible(
    orphan_metadata: dict[str, Any],
    identified_metadata: dict[str, Any],
) -> bool:
    """Reject a match when shared security/classification metadata conflicts."""
    for field in SAFETY_FIELDS:
        orphan_value = orphan_metadata.get(field)
        identified_value = identified_metadata.get(field)
        if (
            orphan_value is not None
            and identified_value is not None
            and orphan_value != identified_value
        ):
            return False
    return True


def find_orphan_duplicate_candidates(
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Find no-ID records that have a matching same-file identified chunk."""
    identified: dict[tuple[str, str], list[dict[str, Any]]] = {}

    for row in rows:
        metadata = row.get("metadata") or {}
        document_id = metadata.get("document_id")
        file_key = source_filename(metadata)
        text_key = normalize_text(str(row.get("document") or ""))
        if document_id and file_key and text_key:
            identified.setdefault((file_key, text_key), []).append(row)

    candidates: list[dict[str, Any]] = []
    for row in rows:
        metadata = row.get("metadata") or {}
        if metadata.get("document_id"):
            continue

        file_key = source_filename(metadata)
        text_key = normalize_text(str(row.get("document") or ""))
        if not file_key or not text_key:
            continue

        matches = identified.get((file_key, text_key), [])
        compatible_matches = [
            match
            for match in matches
            if metadata_compatible(metadata, match.get("metadata") or {})
        ]
        if not compatible_matches:
            continue

        candidate = dict(row)
        candidate["filename"] = file_key
        candidate["matches"] = [
            {
                "vector_id": match.get("id"),
                "document_id": (match.get("metadata") or {}).get("document_id"),
                "title": (match.get("metadata") or {}).get("title"),
            }
            for match in compatible_matches
        ]
        candidates.append(candidate)

    return candidates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Find Chroma chunks missing document_id that duplicate an identified "
            "chunk from the same file. Dry-run by default."
        )
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Delete only the confirmed orphan duplicate vector IDs listed by this scan.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = get_settings()

    if settings.vector_store_backend != "chroma":
        print("This cleanup tool requires VECTOR_STORE_BACKEND=chroma. No data changed.")
        return 2

    vector_store = get_vector_store()
    result = vector_store.get(include=["metadatas", "documents"])
    ids = result.get("ids") or []
    metadatas = result.get("metadatas") or [{} for _ in ids]
    documents = result.get("documents") or ["" for _ in ids]
    rows = [
        {"id": vector_id, "metadata": metadata or {}, "document": document or ""}
        for vector_id, metadata, document in zip(ids, metadatas, documents)
    ]

    candidates = find_orphan_duplicate_candidates(rows)
    print(f"Collection: {settings.chroma_collection_name}")
    print(f"Current chunks: {len(rows)}")
    print(f"Confirmed no-ID duplicate candidates: {len(candidates)}")

    for candidate in candidates:
        print(
            f"  - vector_id={candidate['id']} "
            f"file={candidate['filename']!r} "
            f"matches={candidate['matches']}"
        )

    if not candidates:
        print("Nothing to clean.")
        return 0

    if not args.apply:
        print("\nDry run only; no records were deleted.")
        print("Review the matches, then rerun with --apply to delete only these candidates.")
        return 0

    candidate_ids = [str(candidate["id"]) for candidate in candidates]
    vector_store.delete(ids=candidate_ids)
    print(f"Deleted {len(candidate_ids)} orphan duplicate chunks.")
    print("Chunks with an assigned document_id were not deleted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
