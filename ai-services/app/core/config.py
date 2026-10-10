"""Centralized, environment-based settings for the existing CampusGPT AI service."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


AI_SERVICE_ROOT = Path(__file__).resolve().parents[2]
SUPPORTED_VOYAGE_DIMENSIONS = {256, 512, 1024, 2048}


class Settings(BaseSettings):
    """Runtime configuration; secret values are masked in representations."""

    model_config = SettingsConfigDict(
        env_file=AI_SERVICE_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "INFO"

    # Existing Gemini-compatible generation gateway.
    gemini_model: str = "gemini-3.6-flash"
    gemini_base_url: str = "http://127.0.0.1:8081/v1"
    gemini_api_key: SecretStr = SecretStr("not-needed")

    # Keep the current local setup as the default. Production can opt into
    # a hosted embedding provider without changing the RAG pipeline.
    embedding_provider: Literal["ollama", "voyage"] = "ollama"
    embedding_model: str = "nomic-embed-text:latest"
    embedding_api_key: SecretStr | None = None
    embedding_dimensions: int = Field(default=768, ge=1)
    ollama_base_url: str = "http://127.0.0.1:11434"

    # Chroma remains the default until the Supabase environment is configured.
    vector_store_backend: Literal["chroma", "supabase"] = "chroma"
    chroma_persist_directory: str = "chroma_db"
    chroma_collection_name: str = "campusgpt"

    # Server-side PostgreSQL connection. Never expose this to the frontend.
    database_url: SecretStr | None = None
    pgvector_collection_name: str = "campusgpt"
    database_pool_size: int = Field(default=5, ge=1, le=50)
    database_max_overflow: int = Field(default=5, ge=0, le=100)

    @model_validator(mode="after")
    def validate_provider_configuration(self) -> "Settings":
        if self.vector_store_backend == "supabase" and not self.database_url:
            raise ValueError(
                "DATABASE_URL is required when VECTOR_STORE_BACKEND=supabase."
            )

        if self.embedding_provider == "voyage":
            if not self.embedding_api_key:
                raise ValueError(
                    "EMBEDDING_API_KEY is required when EMBEDDING_PROVIDER=voyage."
                )
            if self.embedding_dimensions not in SUPPORTED_VOYAGE_DIMENSIONS:
                supported = ", ".join(
                    str(value) for value in sorted(SUPPORTED_VOYAGE_DIMENSIONS)
                )
                raise ValueError(
                    "EMBEDDING_DIMENSIONS for Voyage must be one of: "
                    f"{supported}."
                )

        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load settings once per process and reuse the validated instance."""

    return Settings()
