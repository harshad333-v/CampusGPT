"""Validate local Ollama/Chroma configuration and Gemini Web API reachability."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from app.core.config import get_settings
from app.rag.vector_store import get_embeddings, get_vector_store


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-embedding-test",
        action="store_true",
        help="Check model availability without generating a test vector.",
    )
    parser.add_argument(
        "--skip-gemini-check",
        action="store_true",
        help="Skip the HTTP probe of the Gemini Web API gateway.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    errors = 0
    warnings = 0

    try:
        settings = get_settings()
    except Exception as error:
        print(f"[FAIL] Could not load .env/settings: {error}")
        print("Ensure ai-services/.env uses local Chroma + Ollama settings.")
        return 1

    print("CampusGPT local AI setup check")
    print(f"AI root: {AI_ROOT}")
    print(f"Generation gateway: {settings.gemini_base_url}")
    print(f"Generation model: {settings.gemini_model}")
    print(f"Embedding provider: {settings.embedding_provider}")
    print(f"Embedding model: {settings.embedding_model}")
    print(f"Vector store: {settings.vector_store_backend}")

    if settings.vector_store_backend != "chroma":
        print("[FAIL] Local profile requires VECTOR_STORE_BACKEND=chroma.")
        errors += 1
    if settings.embedding_provider != "ollama":
        print("[FAIL] Local profile requires EMBEDDING_PROVIDER=ollama.")
        errors += 1
    if errors:
        print("Fix these values in ai-services/.env, then run this check again.")
        return 1

    ollama_url = settings.ollama_base_url.rstrip("/") + "/api/tags"
    model_available = False
    try:
        with urlopen(ollama_url, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
        model_names = {
            item.get("name", "")
            for item in payload.get("models", [])
            if isinstance(item, dict)
        }
        normalized_models = {name.casefold().removesuffix(":latest") for name in model_names}
        expected = settings.embedding_model.casefold().removesuffix(":latest")
        if expected in normalized_models:
            model_available = True
            print(f"[OK] Ollama is reachable and '{settings.embedding_model}' is installed.")
        else:
            print(f"[FAIL] Ollama is reachable, but '{settings.embedding_model}' is not installed.")
            print(f"Run: ollama pull {settings.embedding_model}")
            print("Models reported by Ollama: " + (", ".join(sorted(model_names)) or "(none)"))
            errors += 1
    except (URLError, TimeoutError, OSError, ValueError) as error:
        print(f"[FAIL] Cannot query Ollama at {ollama_url}: {error}")
        print("Start Ollama and confirm OLLAMA_BASE_URL in ai-services/.env.")
        errors += 1

    if model_available and not args.skip_embedding_test:
        try:
            vector = get_embeddings().embed_query("CampusGPT local embedding smoke test")
            if not vector:
                raise RuntimeError("Embedding model returned an empty vector.")
            print(f"[OK] Local embedding request succeeded (dimensions: {len(vector)}).")
        except Exception as error:
            print(f"[FAIL] Local embedding request failed: {error}")
            errors += 1

    chroma_path = Path(settings.chroma_persist_directory)
    if not chroma_path.is_absolute():
        chroma_path = AI_ROOT / chroma_path
    try:
        store = get_vector_store()
        count = store._collection.count()
        print(f"[OK] Chroma initialized at {chroma_path}")
        print(f"[INFO] Chroma collection '{settings.chroma_collection_name}' currently contains {count} chunks.")
        if count == 0:
            print("[WARN] The vector collection is empty. Ingest documents before asking document questions.")
            warnings += 1
    except Exception as error:
        print(f"[FAIL] Could not initialize local Chroma: {error}")
        errors += 1

    if not args.skip_gemini_check:
        endpoint = settings.gemini_base_url.rstrip("/") + "/models"
        headers = {"Accept": "application/json"}
        api_key = settings.gemini_api_key.get_secret_value()
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        try:
            request = Request(endpoint, headers=headers, method="GET")
            with urlopen(request, timeout=8) as response:
                print(f"[OK] Gemini gateway responded to {endpoint} (HTTP {response.status}).")
        except HTTPError as error:
            if error.code in {404, 405}:
                print(f"[WARN] Gateway is reachable but {endpoint} returned HTTP {error.code}.")
                print("Confirm that POST /v1/chat/completions is supported and test generation in /docs.")
                warnings += 1
            elif error.code in {401, 403}:
                print(f"[FAIL] Gemini gateway rejected the model-list request (HTTP {error.code}); check GEMINI_API_KEY.")
                errors += 1
            else:
                print(f"[FAIL] Gemini gateway returned HTTP {error.code} from {endpoint}.")
                errors += 1
        except (URLError, TimeoutError, OSError) as error:
            print(f"[FAIL] Cannot reach Gemini gateway at {endpoint}: {error}")
            print("Start the gateway and verify GEMINI_BASE_URL.")
            errors += 1
    else:
        print("[SKIP] Gemini gateway probe skipped.")

    if errors:
        print(f"Setup check failed: {errors} error(s), {warnings} warning(s).")
        return 1
    print(f"Setup check passed with {warnings} warning(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
