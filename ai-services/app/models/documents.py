from pydantic import BaseModel, Field


class DocumentIngestRequest(BaseModel):
    document_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    file_path: str = Field(min_length=1)

    document_type: str | None = None
    department: str | None = None
    semester: int | None = Field(default=None, ge=1)
    visibility: str = "PUBLIC"
    tags: list[str] = Field(default_factory=list)


class DocumentIngestResponse(BaseModel):
    success: bool
    document_id: str
    chunks_created: int = Field(ge=0)


class DocumentDeleteResponse(BaseModel):
    success: bool
    document_id: str
    chunks_deleted: int = Field(ge=0)