from pathlib import Path

from app.rag.loaders.document_loader import DocumentLoaderFactory
from app.rag.preprocessors.text_cleaner import preprocess_documents


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"


def main():
    files = [
        path
        for path in DATA_DIR.iterdir()
        if path.suffix.lower() in {".pdf", ".docx"}
    ]

    if not files:
        raise FileNotFoundError("No PDF or DOCX document found in data/")

    file_path = files[0]

    loader = DocumentLoaderFactory.get_loader(str(file_path))
    documents = loader.load(str(file_path))

    processed = preprocess_documents(documents)

    print("=" * 70)
    print(f"FILE: {file_path.name}")
    print("=" * 70)
    print(f"Original documents: {len(documents)}")
    print(f"Processed documents: {len(processed)}")

    for index, document in enumerate(processed[:3]):
        print("\n" + "-" * 70)
        print(f"PROCESSED DOCUMENT {index + 1}")
        print("-" * 70)

        print("Metadata:")
        print(document.metadata)

        print("\nText:")
        print(document.page_content[:2000])


if __name__ == "__main__":
    main()