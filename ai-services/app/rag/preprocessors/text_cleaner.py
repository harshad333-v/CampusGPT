import re

from langchain_core.documents import Document


def clean_text(text: str) -> str:
    """
    Clean extracted document text while preserving
    meaningful content and line structure.
    """

    if not text:
        return ""

    # Normalize different newline formats.
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove excessive spaces/tabs, but keep newlines.
    text = re.sub(r"[ \t]+", " ", text)

    # Remove spaces around newlines.
    text = re.sub(r" *\n *", "\n", text)

    # Collapse excessive blank lines.
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove obvious extraction artifacts.
    text = re.sub(r"Timetable generated:\s*", "", text, flags=re.IGNORECASE)

    return text.strip()


def preprocess_document(document: Document) -> Document:
    """
    Clean a single LangChain Document while preserving metadata.
    """

    cleaned = clean_text(document.page_content)

    return Document(
        page_content=cleaned,
        metadata=dict(document.metadata),
    )


def preprocess_documents(documents: list[Document]) -> list[Document]:
    """
    Preprocess a collection of documents.
    """

    processed = []

    for document in documents:
        cleaned_document = preprocess_document(document)

        if cleaned_document.page_content:
            processed.append(cleaned_document)

    return processed