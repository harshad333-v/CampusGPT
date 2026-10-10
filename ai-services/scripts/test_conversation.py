import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.rag.pipeline import RAGPipeline
from app.models.chat import ConversationMessage


def main():

    pipeline = RAGPipeline()

    conversation = [
        ConversationMessage(
            role="user",
            content="Who teaches DSA?"
        ),
        ConversationMessage(
            role="assistant",
            content="Dr. Aravendra Kumar Sharma teaches DSA."
        ),
    ]

    result = pipeline.run(
        query="What room do they teach in?",
        conversation=conversation,
    )

    print("=" * 70)
    print("ANSWER")
    print("=" * 70)

    print(result.answer)

    print()
    print("Grounded:", result.grounded)

    print()
    print("Documents:", len(result.documents))


if __name__ == "__main__":
    main()