"""Compare Ollama embedding models on a labeled CampusGPT retrieval set.

Dataset format: one JSON object per line:
{
  "query": "give me the information of the blood camp",
  "documents": [
    {"id": "blood-notice", "text": "Blood donation camp ..."},
    {"id": "exam-notice", "text": "Semester examination schedule ..."}
  ],
  "relevant_ids": ["blood-notice"]
}

Use real, representative CampusGPT questions and the actual indexed document
text for a meaningful model decision. This script does not change the active
embedding model or vector database.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys
from time import perf_counter
from typing import Any

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))


def cosine_similarity(left: list[float], right: list[float]) -> float:
    """Cosine similarity for embedding vectors."""
    if len(left) != len(right):
        raise ValueError("Embedding dimensions differ; cannot compare vectors.")
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)


def recall_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    """Fraction of labeled relevant documents retrieved in the top k."""
    if not relevant_ids:
        return 0.0
    return len(set(ranked_ids[:k]) & relevant_ids) / len(relevant_ids)


def reciprocal_rank(ranked_ids: list[str], relevant_ids: set[str]) -> float:
    """Return reciprocal rank of the first relevant result."""
    for rank, document_id in enumerate(ranked_ids, start=1):
        if document_id in relevant_ids:
            return 1.0 / rank
    return 0.0


def load_dataset(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSON on line {line_number}: {error}") from error
            if not isinstance(item.get("query"), str) or not item["query"].strip():
                raise ValueError(f"Line {line_number}: 'query' must be a non-empty string.")
            if not isinstance(item.get("documents"), list) or not item["documents"]:
                raise ValueError(f"Line {line_number}: 'documents' must be a non-empty list.")
            if not isinstance(item.get("relevant_ids"), list) or not item["relevant_ids"]:
                raise ValueError(f"Line {line_number}: 'relevant_ids' must be a non-empty list.")
            ids = set()
            for document in item["documents"]:
                if not isinstance(document, dict) or not document.get("id") or not document.get("text"):
                    raise ValueError(f"Line {line_number}: each document needs non-empty 'id' and 'text'.")
                if document["id"] in ids:
                    raise ValueError(f"Line {line_number}: duplicate document id {document['id']!r}.")
                ids.add(document["id"])
            unknown = set(item["relevant_ids"]) - ids
            if unknown:
                raise ValueError(f"Line {line_number}: relevant_ids not in documents: {sorted(unknown)}")
            records.append(item)
    if not records:
        raise ValueError("Dataset contains no usable JSONL records.")
    return records


def benchmark_model(model_name: str, records: list[dict[str, Any]], base_url: str, top_k: int) -> dict[str, float]:
    try:
        from langchain_ollama import OllamaEmbeddings
    except ImportError as error:
        raise RuntimeError("Install ai-services/requirements.txt before running this benchmark.") from error

    embedder = OllamaEmbeddings(model=model_name, base_url=base_url)
    unique_texts = list(dict.fromkeys(
        document["text"]
        for record in records
        for document in record["documents"]
    ))

    start = perf_counter()
    document_vectors = embedder.embed_documents(unique_texts)
    indexing_seconds = perf_counter() - start
    vectors_by_text = dict(zip(unique_texts, document_vectors))

    recalls: list[float] = []
    reciprocal_ranks: list[float] = []
    query_seconds: list[float] = []
    for record in records:
        start = perf_counter()
        query_vector = embedder.embed_query(record["query"])
        query_seconds.append(perf_counter() - start)
        ranked = sorted(
            record["documents"],
            key=lambda doc: cosine_similarity(query_vector, vectors_by_text[doc["text"]]),
            reverse=True,
        )
        ranked_ids = [doc["id"] for doc in ranked]
        relevant_ids = set(record["relevant_ids"])
        recalls.append(recall_at_k(ranked_ids, relevant_ids, top_k))
        reciprocal_ranks.append(reciprocal_rank(ranked_ids, relevant_ids))

    count = len(records)
    return {
        "queries": float(count),
        "recall_at_k": sum(recalls) / count,
        "mrr": sum(reciprocal_ranks) / count,
        "document_embedding_seconds": indexing_seconds,
        "mean_query_embedding_ms": (sum(query_seconds) / count) * 1000,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", required=True, type=Path, help="Labeled JSONL retrieval dataset.")
    parser.add_argument("--models", default="nomic-embed-text:latest,bge-m3",
                        help="Comma-separated installed Ollama embedding model names.")
    parser.add_argument("--base-url", default="http://127.0.0.1:11434")
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()
    if args.top_k < 1:
        parser.error("--top-k must be at least 1.")
    if not args.dataset.is_file():
        parser.error(f"Dataset not found: {args.dataset}")

    records = load_dataset(args.dataset)
    print(f"Dataset: {args.dataset} ({len(records)} queries); Recall@{args.top_k}, MRR")
    results = []
    for model_name in [value.strip() for value in args.models.split(",") if value.strip()]:
        print(f"Benchmarking {model_name} ...")
        try:
            result = benchmark_model(model_name, records, args.base_url, args.top_k)
            results.append((model_name, result))
        except Exception as error:
            print(f"[FAILED] {model_name}: {error}")

    if not results:
        return 1
    print()
    print(f"{'MODEL':<28} {'RECALL@K':>10} {'MRR':>8} {'DOC EMBED(s)':>13} {'QUERY(ms)':>11}")
    for model_name, result in results:
        print(
            f"{model_name:<28} {result['recall_at_k']:>10.3f} "
            f"{result['mrr']:>8.3f} {result['document_embedding_seconds']:>13.2f} "
            f"{result['mean_query_embedding_ms']:>11.1f}"
        )
    print("\nUse the same held-out queries and candidate documents for every model.")
    print("Do not change the production model based only on latency; compare Recall@K and MRR too.")
    print("Changing models requires rebuilding all vectors in a separate/empty collection or a backup.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
