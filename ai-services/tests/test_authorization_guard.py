from unittest.mock import Mock, patch

from app.rag.pipeline import RAGPipeline


def test_explicit_no_authorized_documents_never_runs_retrieval():
    pipeline = RAGPipeline()
    pipeline.nlp_service = Mock()
    pipeline.nlp_service.analyze.return_value = object()
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
