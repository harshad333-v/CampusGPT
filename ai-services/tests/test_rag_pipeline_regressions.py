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

def test_timetable_answer_prompt_handles_hinglish_relative_days(monkeypatch):
    from app.rag import generator

    captured = {}

    class FakeResponse:
        content = "Kal Sunday hai. Available timetable mein Sunday ki class listed nahi hai; official notice check kar lena."

    class FakeLLM:
        def invoke(self, prompt):
            captured["prompt"] = prompt
            return FakeResponse()

    monkeypatch.setattr(generator, "get_llm", lambda: FakeLLM())

    answer = generator.generate_answer(
        query="kal class hai",
        context="B.Tech V(B) timetable. Monday through Saturday class entries are listed.",
        intent="timetable",
    )

    assert "Kal Sunday hai" in answer
    assert "Asia-Kolkata" in captured["prompt"]
    assert "Match the user's language" in captured["prompt"]
    assert "do not assume that a college is closed merely because it is Sunday" in captured["prompt"]

