from langchain_core.documents import Document

from app.api.documents import replace_document_chunks, stable_chunk_ids


class FakeVectorStore:
    def __init__(self, records):
        self.records = dict(records)
        self.updated = []
        self.added = []
        self.deleted = []

    @property
    def ids(self):
        return set(self.records)

    def get(self, where):
        document_id = where["document_id"]["$eq"]
        return {
            "ids": sorted(
                vector_id
                for vector_id, document in self.records.items()
                if document.metadata.get("document_id") == document_id
            )
        }

    def update_documents(self, ids, documents):
        assert len(ids) == len(documents)
        for vector_id, document in zip(ids, documents):
            self.updated.append(vector_id)
            self.records[vector_id] = document

    def add_documents(self, documents, ids):
        assert len(ids) == len(documents)
        for vector_id, document in zip(ids, documents):
            self.added.append(vector_id)
            self.records[vector_id] = document

    def delete(self, ids):
        self.deleted.extend(ids)
        for vector_id in ids:
            self.records.pop(vector_id, None)


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
    store = FakeVectorStore({
        existing_ids[0]: stable_existing,
        existing_ids[1]: stale_existing,
        unrelated_id: unrelated,
    })

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
