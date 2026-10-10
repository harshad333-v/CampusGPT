from fastapi import APIRouter

from app.models.chat import ChatRequest, ChatResponse, Source
from app.rag.pipeline import RAGPipeline


router = APIRouter(
    prefix="/v1",
    tags=["Chat"],
)

rag_pipeline = RAGPipeline()


@router.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(request: ChatRequest) -> ChatResponse:
    result = rag_pipeline.run(
        query=request.message,
        accessible_document_ids=request.accessible_document_ids,
        conversation=request.conversation,
    )

    # ---------------------------------------------------------------
    # Determine query type
    # ---------------------------------------------------------------

    if result.grounded:
        query_type = "DOCUMENT"

    else:
        nlp_result = rag_pipeline.nlp_service.analyze(
            request.message
        )

        route = rag_pipeline.query_router.route(
            nlp_result
        )

        if route == "GREETING":
            query_type = "GREETING"
        else:
            query_type = "UNSUPPORTED"

    # ---------------------------------------------------------------
    # Build sources
    # ---------------------------------------------------------------

    sources = []
    seen_document_ids = set()

    for document in result.documents:

        metadata = document.metadata

        # IMPORTANT:
        # document_id is the backend/CampusGPT document ID.
        document_id = metadata.get("document_id")

        if not document_id:
            # Old documents ingested before document_id metadata
            # was introduced are skipped as API sources.
            continue

        if document_id in seen_document_ids:
            continue

        seen_document_ids.add(document_id)

        title = metadata.get(
            "title",
            metadata.get(
                "file_name",
                "Unknown document",
            ),
        )

        page = metadata.get("page")

        # LangChain PDF page metadata is zero-based.
        if isinstance(page, int):
            page = page + 1

        sources.append(
            Source(
                document_id=str(document_id),
                title=str(title),
                page=page,
            )
        )

    # ---------------------------------------------------------------
    # Response
    # ---------------------------------------------------------------

    return ChatResponse(
        answer=result.answer,
        sources=sources,
        query_type=query_type,
        grounded=result.grounded,
    )