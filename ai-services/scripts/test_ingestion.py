import sys
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.rag.ingestion import ingest_document
from app.rag.vector_store import (
    get_vector_store,
    generate_document_ids,
)


DATA_DIR = PROJECT_ROOT / "data"


FILES = [
    DATA_DIR / "B.Tech-V(B).pdf",
    DATA_DIR / "Notice_for_emedial_Classes-2.pdf",
    DATA_DIR / "Office_Order___Raksha_Bandan_Holiday.pdf",
    DATA_DIR / "Student_Notice_15.08.2026.pdf",
    DATA_DIR / "syllabus_updated_DSA.pdf",
]


def main():
    vector_store = get_vector_store()

    total_added = 0

    for file_path in FILES:
        print("=" * 70)
        print(f"INGESTING: {file_path.name}")
        print("=" * 70)

        documents = ingest_document(
            str(file_path)
        )

        print(f"Documents/chunks: {len(documents)}")

        if documents:
            ids = generate_document_ids(
                documents
            )

            vector_store.add_documents(
                documents,
                ids=ids,
            )

            total_added += len(documents)

        print("Added/upserted to ChromaDB.")
        print()

    print("=" * 70)
    print(f"TOTAL PROCESSED: {total_added}")
    print("=" * 70)


if __name__ == "__main__":
    main()