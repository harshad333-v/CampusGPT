import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.rag.pipeline import RAGPipeline


TEST_QUERIES = [
    "When is my TOC class on Monday?",
    "Where is my Cryptography class?",
    # "Who teaches Data Science and Analytics?",
    # "When is the Raksha Bandhan holiday?",
    # "What topics are covered in Data Structures and Algorithms?",
    # "When is the Independence Day celebration?",
    # "Hi",
    # "What is the university uniform policy?",
]


def main():

    pipeline = RAGPipeline()

    for query in TEST_QUERIES:

        print()
        print("=" * 70)
        print(f"QUERY: {query}")
        print("=" * 70)

        result = pipeline.run(query)

        print()
        print("ANSWER:")
        print(result.answer)

        print()
        print(f"Grounded: {result.grounded}")
        print(f"Documents: {len(result.documents)}")

        if result.documents:

            print()
            print("SOURCES:")

            seen = set()

            for document in result.documents:

                file_name = document.metadata.get(
                    "file_name",
                    "Unknown",
                )

                if file_name in seen:
                    continue

                seen.add(file_name)

                print(
                    f"- {file_name}"
                )


if __name__ == "__main__":
    main()