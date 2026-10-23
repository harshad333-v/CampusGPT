from langchain_core.documents import Document

from app.nlp.classifier import classify_query
from app.rag.pipeline import RAGPipeline


def test_blood_camp_notice_is_relevant_without_document_type_metadata():
    query = classify_query("give me the information of the blood camp")
    document = Document(
        page_content=(
            "A voluntary blood donation camp will be held on 24 October "
            "in the college auditorium. Registration opens at 9 AM."
        ),
        metadata={"document_id": "blood-camp-1", "file_name": "notice.pdf"},
    )

    assert RAGPipeline()._documents_are_relevant(query, [document]) is True


def test_unrelated_notice_is_not_relevant_to_blood_camp_query():
    query = classify_query("give me the information of the blood camp")
    document = Document(
        page_content="The semester examination form submission deadline is Monday.",
        metadata={"document_type": "NOTICE", "file_name": "exam-notice.pdf"},
    )

    assert RAGPipeline()._documents_are_relevant(query, [document]) is False


def test_event_notice_with_generic_event_query_requires_event_evidence():
    query = classify_query("tell me about college events")
    relevant = Document(
        page_content="The annual cultural event starts at 10 AM in the main hall.",
        metadata={"document_type": "EVENT_NOTICE"},
    )
    unrelated = Document(
        page_content="The semester examination form submission deadline is Monday.",
        metadata={"document_type": "NOTICE"},
    )

    pipeline = RAGPipeline()
    assert pipeline._documents_are_relevant(query, [relevant]) is True
    assert pipeline._documents_are_relevant(query, [unrelated]) is False
