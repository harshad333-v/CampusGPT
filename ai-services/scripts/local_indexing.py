"""Helpers used by the local PDF/DOCX indexing command."""

from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import re
from typing import Any

from langchain_core.documents import Document


AI_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = AI_ROOT / "data"

# Preserve IDs expected by the existing API tests for the bundled sample data.
SAMPLE_METADATA: dict[str, dict[str, Any]] = {
    "B.Tech-V(B).pdf": {
        "document_id": "test-btech-v-b-001",
        "title": "B.Tech V(B) Timetable",
        "document_type": "TIMETABLE",
        "department": "CSE",
        "semester": 5,
        "tags": ["timetable", "CSE", "semester-5"],
    },
    "Notice_for_emedial_Classes-2.pdf": {
        "document_id": "test-emedial-notice",
        "title": "Notice for e-Medial Classes",
        "document_type": "NOTICE",
        "tags": ["notice", "emedial"],
    },
    "Office_Order___Raksha_Bandan_Holiday.pdf": {
        "document_id": "test-raksha-bandhan-holiday",
        "title": "Raksha Bandhan Holiday",
        "document_type": "HOLIDAY_NOTICE",
        "tags": ["holiday", "notice"],
    },
    "Student_Notice_15.08.2026.pdf": {
        "document_id": "test-independence-day-event",
        "title": "Student Notice 15 August 2026",
        "document_type": "EVENT_NOTICE",
        "tags": ["event", "notice"],
    },
    "syllabus_updated_DSA.pdf": {
        "document_id": "test-syllabus-dsa",
        "title": "Updated DSA Syllabus",
        "document_type": "SYLLABUS",
        "department": "CSE",
        "semester": 5,
        "tags": ["syllabus", "DSA", "CSE"],
    },
}


def slugify(value: str) -> str:
    """Make a short readable prefix for a local document ID."""
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")[:36] or "document"


def metadata_for_file(path: Path, root: Path) -> dict[str, Any]:
    """Return stable metadata for a file, preserving sample IDs when appropriate."""
    relative_path = path.resolve().relative_to(root.resolve()).as_posix()
    sample_profile = (
        root.resolve() == DEFAULT_DATA_DIR.resolve()
        and "/" not in relative_path
        and relative_path in SAMPLE_METADATA
    )

    if sample_profile:
        metadata = dict(SAMPLE_METADATA[relative_path])
        metadata["tags"] = list(metadata.get("tags", []))
        return metadata

    identity = sha256(relative_path.casefold().encode("utf-8")).hexdigest()[:20]
    return {
        "document_id": f"local-{slugify(path.stem)}-{identity}",
        "title": path.stem,
        "document_type": None,
        "department": None,
        "semester": None,
        "tags": ["local-import"],
    }


def stable_chunk_ids(document_id: str, documents: list[Document]) -> list[str]:
    """Build deterministic and unique Chroma IDs independent of absolute paths."""
    ids: list[str] = []
    for index, document in enumerate(documents):
        raw = f"{document_id}|{index}|{document.page_content.strip()}"
        ids.append(sha256(raw.encode("utf-8")).hexdigest())
    return ids


def replace_document_vectors(
    vector_store: Any,
    document_id: str,
    documents: list[Document],
) -> int:
    """Upsert current chunks and remove stale chunks for only this document."""
    existing = vector_store.get(where={"document_id": {"$eq": document_id}})
    old_ids = set(existing.get("ids", []))
    new_ids = stable_chunk_ids(document_id, documents)

    if documents:
        vector_store.add_documents(documents, ids=new_ids)

    stale_ids = old_ids.difference(new_ids)
    if stale_ids:
        vector_store.delete(ids=sorted(stale_ids))

    return len(documents)
