from unittest.mock import Mock, patch

from app.rag.pipeline import RAGPipeline


def test_explicit_no_authorized_documents_never_runs_retrieval():
    pipeline = RAGPipeline()
    pipeline.nlp_service = Mock()
    pipeline.nlp_service.analyze.return_value = object()
    pipeline.query_router = Mock()
    pipeline.query_router.route.return_value = "RAG"

    with patch("app.rag.pipeline.retrieve_documents_with_metadata") as retrieve:
        result = pipeline.run(
            query="When is the holiday?",
            deny_document_retrieval=True,
        )

    retrieve.assert_not_called()
    assert result.grounded is False
    assert result.documents == []
    assert "couldn't find" in result.answer.lower()

def test_private_no_access_header_reaches_chat_pipeline(monkeypatch):
    import importlib

    from fastapi.testclient import TestClient

    from app.main import app
    from app.rag.pipeline import RAGResult

    chat_api = importlib.import_module("app.api.chat")
    captured = {}

    def fake_run(**kwargs):
        captured.update(kwargs)
        return RAGResult(
            answer="I couldn't find this information in the available college documents.",
            documents=[],
            grounded=False,
        )

    monkeypatch.setattr(chat_api.rag_pipeline, "run", fake_run)
    monkeypatch.setattr(chat_api.rag_pipeline.nlp_service, "analyze", lambda _query: None)
    monkeypatch.setattr(chat_api.rag_pipeline.query_router, "route", lambda _result: "FALLBACK")

    response = TestClient(app).post(
        "/v1/chat",
        json={
            "message": "When is the holiday?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [],
        },
        headers={"X-CampusGPT-Deny-Document-Retrieval": "true"},
    )

    assert response.status_code == 200
    assert captured["deny_document_retrieval"] is True
    assert set(captured) == {
        "query",
        "accessible_document_ids",
        "conversation",
        "deny_document_retrieval",
    }
