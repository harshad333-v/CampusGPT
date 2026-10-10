from pathlib import Path

from app.rag.loaders.document_loader import DocumentLoaderFactory
from app.rag.chunker import chunk_documents


def main():
    data_dir = Path("data")

    files = list(data_dir.glob("*.pdf")) + list(
        data_dir.glob("*.docx")
    )

    if not files:
        raise FileNotFoundError(
            "No PDF or DOCX document found in data/"
        )

    for file_path in files:

        print("=" * 70)
        print(f"FILE: {file_path.name}")
        print("=" * 70)

        loader = DocumentLoaderFactory.get_loader(
            str(file_path)
        )

        # Your loader API requires file_path in load().
        documents = loader.load(str(file_path))

        chunks = chunk_documents(documents)

        print(f"Original documents: {len(documents)}")
        print(f"Final chunks:       {len(chunks)}")

        for index, chunk in enumerate(chunks[:5], start=1):

            print("\n" + "-" * 70)
            print(f"CHUNK {index}")
            print("-" * 70)

            print("Metadata:")
            print(chunk.metadata)

            print("\nText:")
            print(chunk.page_content)


if __name__ == "__main__":
    main()