from dataclasses import dataclass

from langchain_core.documents import Document

from app.models.chat import ConversationMessage
from app.nlp.router import QueryRouter
from app.nlp.service import NLPService
from app.rag.context_builder import build_context
from app.rag.generator import generate_answer, generate_chat_response
from app.rag.retriever import retrieve_documents_with_metadata


@dataclass
class RAGResult:
    answer: str
    documents: list[Document]
    grounded: bool


class RAGPipeline:

    def __init__(self):
        self.nlp_service = NLPService()
        self.query_router = QueryRouter()

    def _documents_are_relevant(
        self,
        nlp_result,
        documents: list[Document],
    ) -> bool:

        if not documents:
            return False

        entities = nlp_result.entities
        intent = nlp_result.intent

        # ---------------------------------------------------------
        # TIMETABLE
        # ---------------------------------------------------------

        if intent == "timetable":

            for document in documents:

                metadata = document.metadata

                if metadata.get("file_type") != "timetable":
                    continue

                if (
                    entities.subject
                    and metadata.get("subject")
                    != entities.subject
                ):
                    continue

                if (
                    entities.day
                    and metadata.get("day")
                    != entities.day
                ):
                    continue

                if entities.period_start is not None:

                    record_start = metadata.get(
                        "period_start"
                    )

                    record_end = metadata.get(
                        "period_end"
                    )

                    if (
                        record_start is None
                        or record_end is None
                    ):
                        continue

                    requested_end = (
                        entities.period_end
                        if entities.period_end is not None
                        else entities.period_start
                    )

                    if not (
                        record_start <= requested_end
                        and record_end >= entities.period_start
                    ):
                        continue

                return True

            return False

        # ---------------------------------------------------------
        # FACULTY
        # ---------------------------------------------------------

        if intent == "faculty":

            for document in documents:

                metadata = document.metadata

                if metadata.get("file_type") != "timetable":
                    continue

                if (
                    entities.subject
                    and metadata.get("subject")
                    != entities.subject
                ):
                    continue

                if (
                    entities.person_name
                    and metadata.get("faculty")
                    != entities.person_name
                ):
                    continue

                return True

            return False

        # ---------------------------------------------------------
        # EXAM SCHEDULES AND EXAMINATION NOTICES
        # ---------------------------------------------------------

        if intent == "exam_schedule":
            return any(
                document.metadata.get("document_type")
                in {
                    "EXAM_SCHEDULE",
                    "NOTICE",
                    "CIRCULAR",
                }
                for document in documents
            )

        # ---------------------------------------------------------
        # SYLLABUS
        # ---------------------------------------------------------

        if intent == "syllabus":

            for document in documents:

                metadata = document.metadata

                if (
                    metadata.get("document_type")
                    != "SYLLABUS"
                ):
                    continue

                if (
                    entities.subject
                    and metadata.get("subject")
                    != entities.subject
                ):
                    continue

                return True

            return False

        # ---------------------------------------------------------
        # HOLIDAY
        # ---------------------------------------------------------

        if intent == "holiday":

            return any(
                document.metadata.get("document_type")
                == "HOLIDAY_NOTICE"
                for document in documents
            )

        # ---------------------------------------------------------
        # EVENT
        # ---------------------------------------------------------

        if intent == "event":
            # Event/notice metadata is not always normalized on upload.
            # Semantic retrieval already ranks candidates for this query;
            # accept retrieved notice-like documents even if their metadata
            # is absent, so valid uploaded camp notices are not discarded.
            return any(
                document.metadata.get("document_type")
                in {"NOTICE", "EVENT_NOTICE", "CIRCULAR", "EVENT"}
                or any(
                    term in (
                        str(document.metadata.get("title", "")) + " "
                        + str(document.metadata.get("source", "")) + " "
                        + document.page_content
                    ).lower()
                    for term in (
                        "blood", "donation", "camp", "event", "notice"
                    )
                )
                for document in documents
            )

        # ---------------------------------------------------------
        # GENERIC DOCUMENT QUERY
        # ---------------------------------------------------------

        # A generic query must have some structured entity or
        # document type before we consider it grounded.
        #
        # This prevents unrelated similarity-search results from
        # being treated as valid evidence.

        has_structured_entity = any(
            [
                entities.department,
                entities.semester,
                entities.document_type,
                entities.person_name,
                entities.day,
                entities.period_start,
                entities.period_end,
                entities.subject,
            ]
        )

        if not has_structured_entity:
            return False

        return bool(documents)

    def run(
        self,
        query: str,
        top_k: int = 5,
        accessible_document_ids: list[str] | None = None,
        conversation: list[ConversationMessage] | None = None,
        deny_document_retrieval: bool = False,
    ) -> RAGResult:

        # ---------------------------------------------------------
        # NLP
        # ---------------------------------------------------------

        nlp_result = self.nlp_service.analyze(query)

        # ---------------------------------------------------------
        # ROUTING
        # ---------------------------------------------------------

        route = self.query_router.route(
            nlp_result
        )

        # ---------------------------------------------------------
        # GREETING
        # ---------------------------------------------------------

        if route == "GREETING":

            return RAGResult(
                answer=generate_chat_response(
                    query=query,
                    conversation=conversation,
                ),
                documents=[],
                grounded=False,
            )

        # ---------------------------------------------------------
        # UNSUPPORTED
        # ---------------------------------------------------------

        if route == "FALLBACK":

            return RAGResult(
                answer=generate_chat_response(
                    query=query,
                    conversation=conversation,
                ),
                documents=[],
                grounded=False,
            )

        # An empty access allow-list is ambiguous in the legacy public API.
        # The trusted backend can set this explicit flag when authorization found
        # no visible documents, preventing empty-list retrieval from becoming an
        # unrestricted search.
        if deny_document_retrieval:
            return RAGResult(
                answer=(
                    "I couldn't find this information in the available college documents."
                ),
                documents=[],
                grounded=False,
            )

        # ---------------------------------------------------------
        # RETRIEVAL
        # ---------------------------------------------------------

        documents = retrieve_documents_with_metadata(
            nlp_result,
            top_k=top_k,
            accessible_document_ids=accessible_document_ids,
        )

        # ---------------------------------------------------------
        # RELEVANCE / GROUNDING
        # ---------------------------------------------------------

        if not self._documents_are_relevant(
            nlp_result,
            documents,
        ):

            return RAGResult(
                answer=(
                    "I couldn't find this information in the "
                    "available college documents."
                ),
                documents=[],
                grounded=False,
            )

        # ---------------------------------------------------------
        # CONTEXT BUILDING
        # ---------------------------------------------------------

        context = build_context(
            documents
        )

        # ---------------------------------------------------------
        # GENERATION
        # ---------------------------------------------------------

        answer = generate_answer(
            query=nlp_result.normalized_query,
            context=context,
            intent=nlp_result.intent,
            conversation=conversation,
        )

        # ---------------------------------------------------------
        # RESULT
        # ---------------------------------------------------------

        return RAGResult(
            answer=answer,
            documents=documents,
            grounded=True,
        )