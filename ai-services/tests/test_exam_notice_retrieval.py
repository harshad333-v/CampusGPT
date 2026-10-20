from langchain_core.documents import Document

from app.nlp.schemas import NLPResult, QueryEntities
from app.rag.pipeline import RAGPipeline
from app.rag.retriever import build_metadata_filter


def _midterm_exam_query() -> NLPResult:
    query = "When are the midterm examinations?"
    return NLPResult(
        original_query=query,
        normalized_query=query.lower(),
        language="en",
        query_type="DOCUMENT",
        intent="exam_schedule",
        entities=QueryEntities(document_type="EXAM_SCHEDULE"),
    )


def test_exam_schedule_filter_includes_general_notices_and_circulars():
    metadata_filter = build_metadata_filter(_midterm_exam_query())

    assert metadata_filter == {
        "document_type": {
            "$in": ["EXAM_SCHEDULE", "NOTICE", "CIRCULAR"]
        }
    }


def test_exam_schedule_query_accepts_uploaded_notice_documents():
    pipeline = RAGPipeline()
    query = _midterm_exam_query()
    notice = Document(
        page_content="Midterm examinations begin next week.",
        metadata={"document_type": "NOTICE"},
    )

    assert pipeline._documents_are_relevant(query, [notice]) is True


def test_exam_schedule_query_does_not_accept_unrelated_document_types():
    pipeline = RAGPipeline()
    query = _midterm_exam_query()
    syllabus = Document(
        page_content="Course units and learning objectives.",
        metadata={"document_type": "SYLLABUS"},
    )

    assert pipeline._documents_are_relevant(query, [syllabus]) is False
