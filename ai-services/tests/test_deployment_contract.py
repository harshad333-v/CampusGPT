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
    actual = {
        (method, route.path)
        for route in app.routes
        if getattr(route, "path", "") == "/health"
        or getattr(route, "path", "").startswith("/v1/")
        for method in getattr(route, "methods", set())
        if method not in {"HEAD", "OPTIONS"}
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
