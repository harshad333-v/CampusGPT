from langchain_core.documents import Document

from app.api.documents import replace_document_chunks, stable_chunk_ids


class FakeVectorStore:
    def __init__(self, initial_ids):
        self.ids = set(initial_ids)
        self.updated = []
        self.added = []
        self.deleted = []

    def get(self, where):
        assert where == {"document_id": {"$eq": "doc-a"}}
        return {"ids": sorted(self.ids)}

    def update_documents(self, ids, documents):
        self.updated.extend(ids)
        assert len(ids) == len(documents)
        self.ids.update(ids)

    def add_documents(self, documents, ids):
        self.added.extend(ids)
        assert len(documents) == len(ids)
        self.ids.update(ids)

    def delete(self, ids):
        self.deleted.extend(ids)
        self.ids.difference_update(ids)


def test_reindex_updates_current_chunks_and_deletes_stale_chunks_only_for_document():
    stable_existing = Document(
        page_content="Existing chunk",
        metadata={"document_id": "doc-a", "title": "Old title"},
    )
    stale_existing = Document(
        page_content="Stale chunk",
        metadata={"document_id": "doc-a", "title": "Old title"},
    )
    unrelated = Document(
        page_content="Other document",
        metadata={"document_id": "doc-b"},
    )
    existing_ids = stable_chunk_ids("doc-a", [stable_existing, stale_existing])
    unrelated_id = stable_chunk_ids("doc-b", [unrelated])[0]
    store = FakeVectorStore([*existing_ids, unrelated_id])

    current_chunks = [
        Document(
            page_content="Existing chunk",
            metadata={"document_id": "doc-a", "title": "New title"},
        ),
        Document(
            page_content="New chunk",
            metadata={"document_id": "doc-a", "title": "New title"},
        ),
    ]

    count = replace_document_chunks(store, "doc-a", current_chunks)
    current_ids = stable_chunk_ids("doc-a", current_chunks)

    assert count == 2
    assert current_ids[0] in store.updated
    assert current_ids[1] in store.added
    assert existing_ids[1] in store.deleted
    assert unrelated_id in store.ids
    assert existing_ids[1] not in store.ids


def test_stable_chunk_ids_change_when_content_or_order_changes():
    first = [Document(page_content="first"), Document(page_content="second")]
    updated = [Document(page_content="first"), Document(page_content="replacement")]

    assert stable_chunk_ids("doc-a", first)[0] == stable_chunk_ids("doc-a", updated)[0]
    assert stable_chunk_ids("doc-a", first)[1] != stable_chunk_ids("doc-a", updated)[1]
    assert stable_chunk_ids("doc-a", first) != stable_chunk_ids("doc-b", first)
