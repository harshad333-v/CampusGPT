from typing import Literal

from pydantic import BaseModel, Field


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class UserContext(BaseModel):
    role: str | None = None
    department: str | None = None
    semester: int | None = Field(default=None, ge=1)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation: list[ConversationMessage] = Field(default_factory=list)
    user_context: UserContext | None = None
    accessible_document_ids: list[str] = Field(default_factory=list)


class Source(BaseModel):
    document_id: str
    title: str
    page: int | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    query_type: Literal["GREETING", "DOCUMENT", "UNSUPPORTED"]
    grounded: bool