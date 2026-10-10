from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ---------------------------------------------------------------------------
# General text chunking configuration
# ---------------------------------------------------------------------------

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    """
    Return the standard text splitter used by the RAG pipeline.

    RecursiveCharacterTextSplitter attempts to preserve natural
    text boundaries before splitting into smaller chunks.
    """

    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n\n",
            "\n",
            ". ",
            "? ",
            "! ",
            " ",
            "",
        ],
    )


# ---------------------------------------------------------------------------
# Timetable detection
# ---------------------------------------------------------------------------

def is_timetable_document(document: Document) -> bool:
    """
    Check whether a Document is already a structured timetable record.

    Structured timetable records must not be split because each record
    represents one meaningful timetable entry.
    """

    return document.metadata.get("file_type") == "timetable"


# ---------------------------------------------------------------------------
# Main chunking function
# ---------------------------------------------------------------------------

def chunk_documents(
    documents: list[Document],
) -> list[Document]:
    """
    Prepare loaded documents for vector storage.

    Timetable records:
        - remain intact
        - receive timetable-specific chunk metadata

    Normal documents:
        - are split using RecursiveCharacterTextSplitter
    """

    if not documents:
        return []

    splitter = get_text_splitter()

    final_documents: list[Document] = []

    for document in documents:

        # ---------------------------------------------------------------
        # Structured timetable record
        # ---------------------------------------------------------------

        if is_timetable_document(document):

            metadata = dict(document.metadata)

            metadata["chunk_type"] = "timetable_record"
            metadata["chunk_index"] = 0
            metadata["total_chunks"] = 1

            final_documents.append(
                Document(
                    page_content=document.page_content,
                    metadata=metadata,
                )
            )

            continue

        # ---------------------------------------------------------------
        # Normal document
        # ---------------------------------------------------------------

        chunks = splitter.split_documents([document])

        total_chunks = len(chunks)

        for index, chunk in enumerate(chunks):

            metadata = dict(chunk.metadata)

            metadata["chunk_type"] = "text"
            metadata["chunk_index"] = index
            metadata["total_chunks"] = total_chunks

            final_documents.append(
                Document(
                    page_content=chunk.page_content,
                    metadata=metadata,
                )
            )

    return final_documents