from typing import List, Tuple

from langchain_core.documents import Document

from app.nlp.schemas import NLPResult
from app.rag.vector_store import get_vector_store


# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

DEFAULT_TOP_K = 5
TIMETABLE_TOP_K = 10


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _eq(field: str, value) -> dict:
    """Create a Chroma equality condition."""
    return {
        field: {
            "$eq": value
        }
    }


def _in(field: str, values: list) -> dict:
    """Create a Chroma $in condition."""
    return {
        field: {
            "$in": values
        }
    }


def _and(conditions: list[dict]) -> dict | None:
    """Create a Chroma $and filter when multiple conditions exist."""

    if not conditions:
        return None

    if len(conditions) == 1:
        return conditions[0]

    return {
        "$and": conditions
    }


# -------------------------------------------------------------------
# Access Filter
# -------------------------------------------------------------------

def build_access_filter(
    accessible_document_ids: list[str] | None,
) -> dict | None:
    """
    Build a Chroma filter restricting retrieval to authorized documents.

    An empty or None list means no additional access restriction.
    """

    if not accessible_document_ids:
        return None

    # Remove duplicates while preserving order.
    document_ids = list(
        dict.fromkeys(accessible_document_ids)
    )

    if len(document_ids) == 1:
        return _eq(
            "document_id",
            document_ids[0],
        )

    return _in(
        "document_id",
        document_ids,
    )


# -------------------------------------------------------------------
# Filter Combination
# -------------------------------------------------------------------

def combine_filters(
    metadata_filter: dict | None,
    access_filter: dict | None,
) -> dict | None:
    """Combine metadata and access filters using logical AND."""

    if metadata_filter is None:
        return access_filter

    if access_filter is None:
        return metadata_filter

    # Flatten an existing $and expression.
    metadata_conditions = metadata_filter.get("$and")

    if metadata_conditions:
        conditions = list(metadata_conditions)
    else:
        conditions = [metadata_filter]

    conditions.append(access_filter)

    return {
        "$and": conditions
    }


# -------------------------------------------------------------------
# Metadata Filter Builder
# -------------------------------------------------------------------

def build_metadata_filter(
    nlp_result: NLPResult,
) -> dict | None:
    """
    Build a retrieval filter based on NLP intent and entities.

    Retrieval strategy:
        timetable     -> timetable records
        faculty       -> timetable records
        syllabus      -> SYLLABUS documents
        holiday       -> HOLIDAY_NOTICE documents
        event         -> NOTICE or EVENT_NOTICE documents
        exam_schedule -> EXAM_SCHEDULE, NOTICE, or CIRCULAR documents
    """

    entities = nlp_result.entities
    intent = nlp_result.intent

    conditions: list[dict] = []

    # ===============================================================
    # TIMETABLE
    # ===============================================================

    if intent == "timetable":

        conditions.append(
            _eq(
                "file_type",
                "timetable",
            )
        )

        if entities.subject:
            conditions.append(
                _eq(
                    "subject",
                    entities.subject,
                )
            )

        if entities.day:
            conditions.append(
                _eq(
                    "day",
                    entities.day,
                )
            )

        # Exact single-period filter.
        if (
            entities.period_start is not None
            and entities.period_end is not None
            and entities.period_start == entities.period_end
        ):
            conditions.append(
                _eq(
                    "period_start",
                    entities.period_start,
                )
            )

        if entities.department:
            conditions.append(
                _eq(
                    "department",
                    entities.department,
                )
            )

        if entities.semester is not None:
            conditions.append(
                _eq(
                    "semester",
                    entities.semester,
                )
            )

    # ===============================================================
    # FACULTY
    # ===============================================================

    elif intent == "faculty":

        conditions.append(
            _eq(
                "file_type",
                "timetable",
            )
        )

        if entities.subject:
            conditions.append(
                _eq(
                    "subject",
                    entities.subject,
                )
            )

        if entities.person_name:
            conditions.append(
                _eq(
                    "faculty",
                    entities.person_name,
                )
            )

    # ===============================================================
    # EXAM SCHEDULES AND EXAMINATION NOTICES
    # ===============================================================

    elif intent == "exam_schedule":
        # Examination information is often uploaded as a general notice
        # rather than categorized as an EXAM_SCHEDULE. Search all supported
        # exam-related document categories so the type inferred from the
        # question does not exclude the notice that contains the answer.
        conditions.append(
            _in(
                "document_type",
                ["EXAM_SCHEDULE", "NOTICE", "CIRCULAR"],
            )
        )

        if entities.department:
            conditions.append(
                _eq(
                    "department",
                    entities.department,
                )
            )

        if entities.semester is not None:
            conditions.append(
                _eq(
                    "semester",
                    entities.semester,
                )
            )

    # ===============================================================
    # SYLLABUS
    # ===============================================================

    elif intent == "syllabus":

        conditions.append(
            _eq(
                "document_type",
                "SYLLABUS",
            )
        )

        if entities.subject:
            conditions.append(
                _eq(
                    "subject",
                    entities.subject,
                )
            )

    # ===============================================================
    # HOLIDAY
    # ===============================================================

    elif intent == "holiday":

        conditions.append(
            _eq(
                "document_type",
                "HOLIDAY_NOTICE",
            )
        )

    # ===============================================================
    # EVENT
    # ===============================================================

    elif intent == "event":
        # Notices are frequently uploaded with missing or inconsistent
        # document_type metadata. Keep the event search semantic and only
        # apply the trusted access-control filter below.
        pass

    # ===============================================================
    # Generic document_type entity
    # ===============================================================

    if (
        entities.document_type
        and intent not in {
            "holiday",
            "syllabus",
            "event",
            "exam_schedule",
        }
    ):
        conditions.append(
            _eq(
                "document_type",
                entities.document_type,
            )
        )

    return _and(conditions)


# -------------------------------------------------------------------
# Timetable Period Filtering
# -------------------------------------------------------------------

def _period_matches(
    document: Document,
    requested_start: int | None,
    requested_end: int | None,
) -> bool:
    """Check whether a timetable record overlaps the requested period."""

    if requested_start is None:
        return True

    metadata = document.metadata

    record_start = metadata.get("period_start")
    record_end = metadata.get("period_end")

    if record_start is None or record_end is None:
        return False

    if requested_end is None:
        requested_end = requested_start

    return (
        record_start <= requested_end
        and record_end >= requested_start
    )


# -------------------------------------------------------------------
# Main Metadata-Aware Retrieval
# -------------------------------------------------------------------

def retrieve_documents_with_metadata(
    nlp_result: NLPResult,
    top_k: int = DEFAULT_TOP_K,
    accessible_document_ids: list[str] | None = None,
) -> List[Document]:
    """
    Retrieve documents using metadata, access constraints, and similarity.
    """

    vector_store = get_vector_store()

    # Build metadata and access filters.
    metadata_filter = build_metadata_filter(nlp_result)

    access_filter = build_access_filter(
        accessible_document_ids
    )

    combined_filter = combine_filters(
        metadata_filter,
        access_filter,
    )

    # ---------------------------------------------------------------
    # Timetable queries
    # ---------------------------------------------------------------

    if nlp_result.intent == "timetable":

        documents = vector_store.similarity_search(
            nlp_result.normalized_query,
            k=TIMETABLE_TOP_K,
            filter=combined_filter,
        )

        entities = nlp_result.entities

        if entities.period_start is not None:
            documents = [
                document
                for document in documents
                if _period_matches(
                    document,
                    entities.period_start,
                    entities.period_end,
                )
            ]

        return documents[:top_k]

    # ---------------------------------------------------------------
    # Structured queries
    # ---------------------------------------------------------------

    if combined_filter is not None:
        return vector_store.similarity_search(
            nlp_result.normalized_query,
            k=top_k,
            filter=combined_filter,
        )

    # ---------------------------------------------------------------
    # Generic semantic retrieval
    # ---------------------------------------------------------------

    return vector_store.similarity_search(
        nlp_result.normalized_query,
        k=top_k,
    )


# -------------------------------------------------------------------
# Basic Semantic Retrieval
# -------------------------------------------------------------------

def retrieve_documents(
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> List[Document]:
    """Semantic-only retrieval."""

    vector_store = get_vector_store()

    return vector_store.similarity_search(
        query,
        k=top_k,
    )


# -------------------------------------------------------------------
# Scored Semantic Retrieval
# -------------------------------------------------------------------

def retrieve_documents_with_scores(
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> List[Tuple[Document, float]]:
    """Semantic retrieval with relevance scores."""

    vector_store = get_vector_store()

    return (
        vector_store
        .similarity_search_with_relevance_scores(
            query,
            k=top_k,
        )
    )


# -------------------------------------------------------------------
# Scored Metadata-Aware Retrieval
# -------------------------------------------------------------------

def retrieve_documents_with_metadata_and_scores(
    nlp_result: NLPResult,
    top_k: int = DEFAULT_TOP_K,
    accessible_document_ids: list[str] | None = None,
) -> List[Tuple[Document, float]]:
    """Metadata-aware retrieval with relevance scores."""

    vector_store = get_vector_store()

    metadata_filter = build_metadata_filter(nlp_result)

    access_filter = build_access_filter(
        accessible_document_ids
    )

    combined_filter = combine_filters(
        metadata_filter,
        access_filter,
    )

    # No filter.
    if combined_filter is None:
        return (
            vector_store
            .similarity_search_with_relevance_scores(
                nlp_result.normalized_query,
                k=top_k,
            )
        )

    # Filtered retrieval.
    results = (
        vector_store
        .similarity_search_with_relevance_scores(
            nlp_result.normalized_query,
            k=top_k,
            filter=combined_filter,
        )
    )

    # Apply timetable period filtering.
    if nlp_result.intent == "timetable":

        entities = nlp_result.entities

        if entities.period_start is not None:
            results = [
                (document, score)
                for document, score in results
                if _period_matches(
                    document,
                    entities.period_start,
                    entities.period_end,
                )
            ]

    return results[:top_k]