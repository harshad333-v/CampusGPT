from typing import Literal

from pydantic import BaseModel, Field


QueryType = Literal["GREETING", "DOCUMENT", "UNSUPPORTED"]

Language = Literal["en", "hi", "hinglish", "mixed", "unknown"]


class QueryEntities(BaseModel):
    department: str | None = None
    semester: int | None = Field(default=None, ge=1)
    document_type: str | None = None
    person_name: str | None = None

    day: str | None = None
    period_start: int | None = Field(default=None, ge=1)
    period_end: int | None = Field(default=None, ge=1)
    subject: str | None = None


class NLPResult(BaseModel):
    original_query: str
    normalized_query: str
    language: Language
    query_type: QueryType
    intent: str | None = None
    entities: QueryEntities = Field(default_factory=QueryEntities)