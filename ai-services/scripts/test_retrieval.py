from app.rag.retriever import retrieve_documents


TEST_QUERIES = [
    "When is my TOC class on Monday?",
    "Who teaches Data Science and Analytics?",
    "Where is my Cryptography class?",
    "What do I have in periods 5 and 6 on Monday?",
    "When is the Raksha Bandhan holiday?",
    "What are the university uniform rules?",
    "When is the Independence Day celebration?",
    "What topics are covered in Data Structures and Algorithms?",
]


def main():
    for query in TEST_QUERIES:
        print("\n" + "=" * 70)
        print(f"QUERY: {query}")
        print("=" * 70)

        documents = retrieve_documents(query)

        print(f"Retrieved documents: {len(documents)}")

        for i, doc in enumerate(documents, start=1):
            print("\n" + "-" * 70)
            print(f"RESULT {i}")
            print("-" * 70)

            print("Source:", doc.metadata.get("source"))
            print("File:", doc.metadata.get("file_name"))
            print("Type:", doc.metadata.get("file_type"))
            print("Chunk type:", doc.metadata.get("chunk_type"))
            print("Day:", doc.metadata.get("day"))
            print("Subject:", doc.metadata.get("subject"))
            print("Faculty:", doc.metadata.get("faculty"))
            print("Room:", doc.metadata.get("room"))

            print("\nText:")
            print(doc.page_content[:1000])


if __name__ == "__main__":
    main()