from langchain_core.documents import Document


def build_context(documents: list[Document]) -> str:
    """
    Convert retrieved documents into a grounded context block
    for the LLM.
    """

    if not documents:
        return ""

    context_parts = []

    for index, document in enumerate(documents, start=1):
        metadata = document.metadata

        source = metadata.get(
            "file_name",
            metadata.get("source", "Unknown source"),
        )

        page = metadata.get("page")

        if page is not None:
            source_line = f"Source: {source}, Page: {page}"
        else:
            source_line = f"Source: {source}"

        context_parts.append(
            f"[Document {index}]\n"
            f"{source_line}\n"
            f"{document.page_content.strip()}"
        )

    return "\n\n".join(context_parts)