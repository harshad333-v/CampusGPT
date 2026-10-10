from fastapi import APIRouter, HTTPException

from app.models.documents import (
    DocumentDeleteResponse,
    DocumentIngestRequest,
    DocumentIngestResponse,
)

from app.rag.ingestion import ingest_document
from app.rag.vector_store import (
    get_vector_store,
    generate_document_ids,
)


router = APIRouter(
    prefix="/v1/documents",
    tags=["Documents"],
)


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

        ids = generate_document_ids(documents)

        vector_store.add_documents(
            documents,
            ids=ids,
        )

        return DocumentIngestResponse(
            success=True,
            document_id=request.document_id,
            chunks_created=len(documents),
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document ingestion failed: {exc}",
        )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
)
def delete_document(
    document_id: str,
) -> DocumentDeleteResponse:

    try:
        vector_store = get_vector_store()

        # Get all chunks belonging to this document.
        result = vector_store.get(
            where={
                "document_id": {
                    "$eq": document_id
                }
            }
        )

        ids = result.get("ids", [])

        if ids:
            vector_store.delete(
                ids=ids
            )

        return DocumentDeleteResponse(
            success=True,
            document_id=document_id,
            chunks_deleted=len(ids),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document deletion failed: {exc}",
        )