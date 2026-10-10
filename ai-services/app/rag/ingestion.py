from pathlib import Path

from langchain_core.documents import Document

from app.rag.loaders.document_loader import DocumentLoaderFactory
from app.rag.preprocessors.timetable_parser import (
    parse_timetable,
    is_timetable_pdf,
)
from app.rag.chunker import chunk_documents


DOCUMENT_TYPE_RULES = {
    "holiday": "HOLIDAY_NOTICE",
    "raksha": "HOLIDAY_NOTICE",
    "bandan": "HOLIDAY_NOTICE",

    "independence": "EVENT_NOTICE",
    "15.08": "EVENT_NOTICE",
    "event": "EVENT_NOTICE",

    "emedial": "NOTICE",
    "notice": "NOTICE",

    "syllabus": "SYLLABUS",
}


SUBJECT_RULES = {
    "data structures and algorithms": "DATA STRUCTURES AND ALGORITHMS",
    "data structures": "DATA STRUCTURES AND ALGORITHMS",
    "data structure": "DATA STRUCTURES AND ALGORITHMS",
    "dsa": "DATA STRUCTURES AND ALGORITHMS",

    "theory of computation": "TOC",
    "toc": "TOC",

    "cryptography": "CRYPTOGRAPHY",
    "crypto": "CRYPTOGRAPHY",

    "data science and analytics": "DATA SCIENCE & ANALYTICS",
    "data science & analytics": "DATA SCIENCE & ANALYTICS",
    "data science": "DATA SCIENCE & ANALYTICS",

    "minor project": "MINOR PROJECT-IV",

    "oops": "OOPS",
    "dbms": "DBMS",

    "computer system organisation": "CSO",
    "computer system organization": "CSO",

    "discrete mathematics": "DISCRETE MATHEMATICS",
}


def infer_document_type(file_name: str) -> str | None:
    name = file_name.lower()

    for keyword, document_type in DOCUMENT_TYPE_RULES.items():
        if keyword in name:
            return document_type

    return None


def infer_subject(file_name: str) -> str | None:
    name = file_name.lower()

    rules = sorted(
        SUBJECT_RULES.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    for keyword, subject in rules:
        if keyword in name:
            return subject

    return None


def enrich_document_metadata(
    documents: list[Document],
    file_path: str,
    document_id: str | None = None,
    title: str | None = None,
    document_type: str | None = None,
    department: str | None = None,
    semester: int | None = None,
    visibility: str | None = None,
    tags: list[str] | None = None,
) -> list[Document]:

    path = Path(file_path)
    file_name = path.name

    inferred_type = infer_document_type(file_name)

    # API-supplied document_type takes priority.
    final_document_type = document_type or inferred_type

    subject = infer_subject(file_name)

    enriched_documents = []

    for document in documents:

        metadata = dict(document.metadata)

        metadata["file_name"] = file_name

        if title:
            metadata["title"] = title

        if document_id:
            metadata["document_id"] = document_id

        if final_document_type:
            metadata["document_type"] = final_document_type

        if department:
            metadata["department"] = department

        if semester is not None:
            metadata["semester"] = semester

        if visibility:
            metadata["visibility"] = visibility

        if tags:
            metadata["tags"] = ",".join(tags)

        if subject:
            metadata["subject"] = subject

        enriched_documents.append(
            Document(
                page_content=document.page_content,
                metadata=metadata,
            )
        )

    return enriched_documents


def ingest_document(
    file_path: str,
    document_id: str | None = None,
    title: str | None = None,
    document_type: str | None = None,
    department: str | None = None,
    semester: int | None = None,
    visibility: str | None = None,
    tags: list[str] | None = None,
) -> list[Document]:

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document not found: {path}"
        )

    if is_timetable_pdf(str(path)):
        documents = parse_timetable(str(path))
    else:
        loader = DocumentLoaderFactory.get_loader(
            str(path)
        )
        documents = loader.load(str(path))

    documents = enrich_document_metadata(
        documents=documents,
        file_path=str(path),
        document_id=document_id,
        title=title,
        document_type=document_type,
        department=department,
        semester=semester,
        visibility=visibility,
        tags=tags,
    )

    chunks = chunk_documents(documents)

    return chunks