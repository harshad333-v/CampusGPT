from typing import Literal

from app.nlp.schemas import NLPResult


Route = Literal["GREETING", "RAG", "FALLBACK"]


class QueryRouter:
    """
    Routes an analyzed query to the appropriate processing path.

    Important:
    The router does not decide whether a document contains
    the answer. That is the responsibility of retrieval and
    grounding.
    """

    def route(self, result: NLPResult) -> Route:
        if result.query_type == "GREETING":
            return "GREETING"

        if result.query_type == "DOCUMENT":
            return "RAG"

        return "FALLBACK"