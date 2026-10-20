from hashlib import sha256

from fastapi import APIRouter, HTTPException

from app.models.documents import (
    DocumentDeleteResponse,
    DocumentIngestRequest,
    DocumentIngestResponse,
)
from app.rag.ingestion import ingest_document
from app.rag.vector_store import delete_document_chunks, get_vector_store


router = APIRouter(
    prefix="/v1/documents",
    tags=["Documents"],
)


def stable_chunk_ids(document_id: str, documents) -> list[str]:
    """Create deterministic IDs scoped to one backend document ID."""
    ids = []
    for index, document in enumerate(documents):
        raw = f"{document_id}|{index}|{document.page_content.strip()}"
        ids.append(sha256(raw.encode("utf-8")).hexdigest())
    return ids


def replace_document_chunks(vector_store, document_id: str, documents) -> int:
    """Upsert current chunks and delete stale chunks belonging only to this ID."""
    existing = vector_store.get(where={"document_id": {"$eq": document_id}})
    old_ids = set(existing.get("ids", []))
    new_ids = stable_chunk_ids(document_id, documents)

    update_ids = []
    update_documents = []
    add_ids = []
    add_documents = []

    for chunk_id, document in zip(new_ids, documents):
        if chunk_id in old_ids:
            update_ids.append(chunk_id)
            update_documents.append(document)
        else:
            add_ids.append(chunk_id)
            add_documents.append(document)

    if update_ids:
        vector_store.update_documents(ids=update_ids, documents=update_documents)
    if add_documents:
        vector_store.add_documents(add_documents, ids=add_ids)

    stale_ids = old_ids.difference(new_ids)
    if stale_ids:
        vector_store.delete(ids=sorted(stale_ids))

    return len(documents)


@router.post(
    "/ingest",
    response_model=DocumentIngestResponse,
)
def ingest_document_api(
    request: DocumentIngestRequest,
) -> DocumentIngestResponse:
    try:
        documents = ingest_document(
            file_path=request.file_path,
            document_id=request.document_id,
            title=request.title,
            document_type=request.document_type,
            department=request.department,
            semester=request.semester,
            visibility=request.visibility,
            tags=request.tags,
        )

        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No text or records could be extracted from the document.",
            )

        vector_store = get_vector_store()
        chunk_count = replace_document_chunks(
            vector_store,
            request.document_id,
            documents,
        )

        return DocumentIngestResponse(
            success=True,
            document_id=request.document_id,
            chunks_created=chunk_count,
        )

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Document ingestion failed. Check the AI service logs for details.",
        ) from exc


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
)
def delete_document(
    document_id: str,
) -> DocumentDeleteResponse:
    try:
        chunks_deleted = delete_document_chunks(document_id)
        return DocumentDeleteResponse(
            success=True,
            document_id=document_id,
            chunks_deleted=chunks_deleted,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Document deletion failed. Check the AI service logs for details.",
        ) from exc
