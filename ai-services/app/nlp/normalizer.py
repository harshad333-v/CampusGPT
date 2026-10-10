import re
import unicodedata


def normalize_query(query: str) -> str:
    """
    Normalize user input while preserving its meaning and language.

    This function does not translate, classify, or rewrite the query.
    """

    # Normalize Unicode representation.
    text = unicodedata.normalize("NFKC", query)

    # Remove leading/trailing whitespace.
    text = text.strip()

    # Collapse repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text