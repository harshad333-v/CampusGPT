from langchain_core.documents import Document

from scripts.local_indexing import metadata_for_file, stable_chunk_ids


def test_stable_chunk_ids_are_repeatable_and_unique():
    docs = [
        Document(page_content="same", metadata={"page": 1}),
        Document(page_content="same", metadata={"page": 1}),
    ]

    first = stable_chunk_ids("doc-1", docs)
    second = stable_chunk_ids("doc-1", docs)

    assert first == second
    assert first[0] != first[1]


def test_bundled_timetable_keeps_existing_test_document_id():
    from scripts.local_indexing import DEFAULT_DATA_DIR

    path = DEFAULT_DATA_DIR / "B.Tech-V(B).pdf"
    metadata = metadata_for_file(path, DEFAULT_DATA_DIR)

    assert metadata["document_id"] == "test-btech-v-b-001"
    assert metadata["document_type"] == "TIMETABLE"
