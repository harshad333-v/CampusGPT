from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


# -------------------------------------------------------------------
# Health
# -------------------------------------------------------------------

def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "campusgpt-ai"


# -------------------------------------------------------------------
# Chat - Greeting
# -------------------------------------------------------------------

def test_chat_greeting():
    response = client.post(
        "/v1/chat",
        json={
            "message": "Hi",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["query_type"] == "GREETING"
    assert data["grounded"] is False
    assert len(data["sources"]) == 0


# -------------------------------------------------------------------
# Chat - Unsupported
# -------------------------------------------------------------------

def test_chat_unsupported():
    response = client.post(
        "/v1/chat",
        json={
            "message": "What is the university uniform policy?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [
                "does-not-exist",
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["grounded"] is False
    assert len(data["sources"]) == 0


# -------------------------------------------------------------------
# Chat - Authorized timetable
# -------------------------------------------------------------------

def test_chat_authorized_timetable():
    response = client.post(
        "/v1/chat",
        json={
            "message": "When is my TOC class on Monday?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [
                "test-btech-v-b-001",
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["query_type"] == "DOCUMENT"
    assert data["grounded"] is True
    assert len(data["sources"]) > 0

    source = data["sources"][0]

    assert source["document_id"] == "test-btech-v-b-001"
    assert source["title"] == "B.Tech V(B) Timetable"


# -------------------------------------------------------------------
# Chat - Unauthorized timetable
# -------------------------------------------------------------------

def test_chat_unauthorized_timetable():
    response = client.post(
        "/v1/chat",
        json={
            "message": "When is my TOC class on Monday?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [
                "does-not-exist",
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["grounded"] is False
    assert data["query_type"] == "UNSUPPORTED"
    assert len(data["sources"]) == 0


# -------------------------------------------------------------------
# Chat - Multiple authorized documents
# -------------------------------------------------------------------

def test_chat_multiple_authorized_documents():
    response = client.post(
        "/v1/chat",
        json={
            "message": "When is my TOC class on Monday?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [
                "some-other-document",
                "test-btech-v-b-001",
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["grounded"] is True
    assert data["query_type"] == "DOCUMENT"

    document_ids = [
        source["document_id"]
        for source in data["sources"]
    ]

    assert "test-btech-v-b-001" in document_ids


# -------------------------------------------------------------------
# Chat - Empty access list
# -------------------------------------------------------------------

def test_chat_empty_access_list():
    response = client.post(
        "/v1/chat",
        json={
            "message": "When is my TOC class on Monday?",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["grounded"] is True
    assert data["query_type"] == "DOCUMENT"


# -------------------------------------------------------------------
# Validation
# -------------------------------------------------------------------

def test_chat_empty_message():
    response = client.post(
        "/v1/chat",
        json={
            "message": "",
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [],
        },
    )

    assert response.status_code == 422

# -------------------------------------------------------------------
# Chat - Casual conversation and shorthand
# -------------------------------------------------------------------

import pytest

@pytest.mark.parametrize("message", [
    "hey", "help u", "how r u", "how are you?", "good morning",
    "thanks", "what can you do?", "bye", "goodbye",
])
def test_chat_casual_conversation(message, monkeypatch):
    from app.rag.pipeline import RAGPipeline

    monkeypatch.setattr(
        "app.rag.pipeline.generate_chat_response",
        lambda query, conversation=None: "Hello! I can help. What do you need?",
    )
    response = client.post(
        "/v1/chat",
        json={
            "message": message,
            "conversation": [],
            "user_context": None,
            "accessible_document_ids": [],
        },
    )
    assert response.status_code == 200
    assert response.json()["query_type"] == "GREETING"
    assert "help" in response.json()["answer"].lower()


def test_blood_donation_camp_is_classified_as_event():
    from app.nlp.classifier import classify_query

    result = classify_query("give me the information of the blood camp")
    assert result.query_type == "DOCUMENT"
    assert result.intent == "event"


def test_campus_word_is_not_misclassified_as_event():
    from app.nlp.classifier import classify_query

    result = classify_query("Tell me about campus facilities")
    assert result.intent != "event"
