from pathlib import Path

from app.rag.loaders.document_loader import DocumentLoaderFactory


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"


def main():
    files = [
        path
        for path in DATA_DIR.iterdir()
        if path.suffix.lower() in {".pdf", ".docx"}
    ]

    if not files:
        raise FileNotFoundError(
            "No PDF or DOCX document found in data/"
        )

    file_path = files[0]

    print("=" * 70)
    print(f"FILE: {file_path.name}")
    print("=" * 70)

    loader = DocumentLoaderFactory.get_loader(str(file_path))
    documents = loader.load(str(file_path))

    print(f"Pages/documents loaded: {len(documents)}")

    for index, document in enumerate(documents[:3]):
        print("\n" + "-" * 70)
        print(f"DOCUMENT {index + 1}")
        print("-" * 70)

        print("Metadata:")
        print(document.metadata)

        print("\nText preview:")
        print(document.page_content[:1000])


if __name__ == "__main__":
    main()