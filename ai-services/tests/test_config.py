import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_settings_keep_existing_local_backend():
    settings = Settings(_env_file=None)

    assert settings.vector_store_backend == "chroma"
    assert settings.embedding_provider == "ollama"
    assert settings.chroma_collection_name == "campusgpt"
    assert settings.ollama_base_url == "http://127.0.0.1:11434"
    assert settings.gemini_base_url == "http://127.0.0.1:8081/v1"


def test_supabase_backend_requires_database_url():
    with pytest.raises(ValidationError, match="DATABASE_URL is required"):
        Settings(_env_file=None, vector_store_backend="supabase")


def test_voyage_provider_requires_api_key():
    with pytest.raises(ValidationError, match="EMBEDDING_API_KEY is required"):
        Settings(_env_file=None, embedding_provider="voyage")


def test_secret_values_are_not_rendered_in_settings_repr():
    settings = Settings(
        _env_file=None,
        gemini_api_key="test-secret-value",
    )

    assert "test-secret-value" not in repr(settings)
    assert "**********" in repr(settings)
