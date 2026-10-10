import sys
from pathlib import Path

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.nlp.service import NLPService


TEST_QUERIES = [
    "When is my TOC class on Monday?",
    "What do I have in periods 5 and 6 on Monday?",
    "Where is my Cryptography class?",
    "Who teaches Data Science and Analytics?",
    "When is the Raksha Bandhan holiday?",
    "What are the university uniform rules?",
    "When is the Independence Day celebration?",
    "What topics are covered in Data Structures and Algorithms?",
    "Hi",
]


def main():
    service = NLPService()

    for query in TEST_QUERIES:
        result = service.analyze(query)

        print("\n" + "=" * 70)
        print(f"QUERY: {query}")
        print("=" * 70)

        print(f"normalized_query: {result.normalized_query}")
        print(f"language:         {result.language}")
        print(f"query_type:       {result.query_type}")
        print(f"intent:           {result.intent}")

        print("\nEntities:")
        print(f"  department:     {result.entities.department}")
        print(f"  semester:       {result.entities.semester}")
        print(f"  document_type:  {result.entities.document_type}")
        print(f"  person_name:    {result.entities.person_name}")
        print(f"  day:            {result.entities.day}")
        print(f"  period_start:   {result.entities.period_start}")
        print(f"  period_end:     {result.entities.period_end}")
        print(f"  subject:        {result.entities.subject}")


if __name__ == "__main__":
    main()