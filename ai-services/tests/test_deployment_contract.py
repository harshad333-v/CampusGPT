from app.main import app
from app.models.chat import ChatRequest, ChatResponse
from app.models.documents import (
    DocumentDeleteResponse,
    DocumentIngestRequest,
    DocumentIngestResponse,
)


EXPECTED_PUBLIC_ROUTES = {
    ("GET", "/health"),
    ("POST", "/v1/chat"),
    ("POST", "/v1/documents/ingest"),
    ("DELETE", "/v1/documents/{document_id}"),
}


def test_existing_public_routes_and_methods_are_preserved():
    # Use FastAPI's generated OpenAPI schema as the public route contract.
    # Newer FastAPI versions can defer included-router expansion in app.routes.
    paths = app.openapi()["paths"]
    actual = {
        (method.upper(), path)
        for path, operations in paths.items()
        for method in operations
    }

    assert actual == EXPECTED_PUBLIC_ROUTES


def test_existing_chat_schema_fields_are_preserved():
    assert set(ChatRequest.model_fields) == {
        "message",
        "conversation",
        "user_context",
        "accessible_document_ids",
    }
    assert set(ChatResponse.model_fields) == {
        "answer",
        "sources",
        "query_type",
        "grounded",
    }


def test_existing_document_schema_fields_are_preserved():
    assert set(DocumentIngestRequest.model_fields) == {
        "document_id",
        "title",
        "file_path",
        "document_type",
        "department",
        "semester",
        "visibility",
        "tags",
    }
    assert set(DocumentIngestResponse.model_fields) == {
        "success",
        "document_id",
        "chunks_created",
    }
    assert set(DocumentDeleteResponse.model_fields) == {
        "success",
        "document_id",
        "chunks_deleted",
    }
