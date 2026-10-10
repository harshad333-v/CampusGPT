import sys
from pathlib import Path

# Add project root to Python path
sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.nlp.service import NLPService
from app.rag.retriever import retrieve_documents_with_metadata


TEST_QUERIES = [
    "When is my TOC class on Monday?",
    "Where is my Cryptography class?",
    "Who teaches Data Science and Analytics?",
    "When is the Raksha Bandhan holiday?",
]


def main():
    nlp_service = NLPService()

    for query in TEST_QUERIES:

        print("\n" + "=" * 70)
        print(f"QUERY: {query}")
        print("=" * 70)

        # -------------------------------------------------
        # NLP
        # -------------------------------------------------

        nlp_result = nlp_service.analyze(query)

        print("\nNLP:")
        print(f"  intent:   {nlp_result.intent}")
        print(f"  subject:  {nlp_result.entities.subject}")
        print(f"  day:      {nlp_result.entities.day}")
        print(f"  document: {nlp_result.entities.document_type}")

        # -------------------------------------------------
        # Retrieval
        # -------------------------------------------------

        documents = retrieve_documents_with_metadata(
            nlp_result,
            top_k=5,
        )

        print(f"\nRetrieved documents: {len(documents)}")

        for index, document in enumerate(
            documents,
            start=1,
        ):

            print("\n" + "-" * 70)
            print(f"RESULT {index}")
            print("-" * 70)

            print(
                "Source:",
                document.metadata.get("source"),
            )

            print(
                "File:",
                document.metadata.get("file_name"),
            )

            print(
                "Chunk type:",
                document.metadata.get("chunk_type"),
            )

            print(
                "Day:",
                document.metadata.get("day"),
            )

            print(
                "Period:",
                document.metadata.get("period_start"),
                "-",
                document.metadata.get("period_end"),
            )

            print(
                "Subject:",
                document.metadata.get("subject"),
            )

            print(
                "Faculty:",
                document.metadata.get("faculty"),
            )

            print(
                "Room:",
                document.metadata.get("room"),
            )

            print("\nText:")
            print(document.page_content[:500])


if __name__ == "__main__":
    main()