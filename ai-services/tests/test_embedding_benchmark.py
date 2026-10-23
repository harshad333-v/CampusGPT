from scripts.benchmark_embeddings import cosine_similarity, recall_at_k, reciprocal_rank


def test_cosine_similarity_orders_identical_vectors_highest():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_cosine_similarity_rejects_dimension_mismatch():
    import pytest

    with pytest.raises(ValueError, match="dimensions differ"):
        cosine_similarity([1.0], [1.0, 0.0])


def test_recall_at_k_counts_relevant_documents():
    assert recall_at_k(["a", "b", "c"], {"b", "c"}, 2) == 0.5
    assert recall_at_k(["a", "b"], {"b"}, 2) == 1.0


def test_reciprocal_rank_uses_first_relevant_result():
    assert reciprocal_rank(["x", "b", "c"], {"b", "c"}) == 0.5
    assert reciprocal_rank(["x", "y"], {"z"}) == 0.0
