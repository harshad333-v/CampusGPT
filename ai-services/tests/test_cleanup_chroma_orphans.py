from scripts.cleanup_chroma_orphans import find_orphan_duplicate_candidates


def test_only_unidentified_chunks_with_same_file_and_text_are_candidates():
    rows = [
        {
            "id": "orphan-1",
            "metadata": {"file_name": "holiday.pdf"},
            "document": "Holiday on Friday, August 28.",
        },
        {
            "id": "identified-1",
            "metadata": {
                "document_id": "holiday-2026",
                "file_name": "holiday.pdf",
                "title": "Holiday Notice",
            },
            "document": " Holiday   on Friday, August 28. ",
        },
        {
            "id": "different-file",
            "metadata": {"file_name": "other.pdf"},
            "document": "Holiday on Friday, August 28.",
        },
    ]

    candidates = find_orphan_duplicate_candidates(rows)

    assert [row["id"] for row in candidates] == ["orphan-1"]
    assert candidates[0]["matches"][0]["document_id"] == "holiday-2026"


def test_does_not_mark_identified_duplicate_ids_for_deletion():
    rows = [
        {
            "id": "holiday-2026",
            "metadata": {
                "document_id": "holiday-2026",
                "file_name": "holiday.pdf",
            },
            "document": "Holiday on Friday.",
        },
        {
            "id": "test-holiday",
            "metadata": {
                "document_id": "test-holiday",
                "file_name": "holiday.pdf",
            },
            "document": "Holiday on Friday.",
        },
    ]

    assert find_orphan_duplicate_candidates(rows) == []


def test_does_not_remove_orphan_when_visibility_conflicts():
    rows = [
        {
            "id": "orphan-private",
            "metadata": {
                "file_name": "holiday.pdf",
                "visibility": "PRIVATE",
            },
            "document": "Holiday on Friday.",
        },
        {
            "id": "identified-public",
            "metadata": {
                "document_id": "holiday-2026",
                "file_name": "holiday.pdf",
                "visibility": "PUBLIC",
            },
            "document": "Holiday on Friday.",
        },
    ]

    assert find_orphan_duplicate_candidates(rows) == []


def test_orphan_without_an_identified_same_file_match_is_preserved():
    rows = [
        {
            "id": "orphan-unique",
            "metadata": {"file_name": "holiday.pdf"},
            "document": "Unique notice text.",
        },
        {
            "id": "identified-different",
            "metadata": {
                "document_id": "different",
                "file_name": "holiday.pdf",
            },
            "document": "Different notice text.",
        },
    ]

    assert find_orphan_duplicate_candidates(rows) == []
