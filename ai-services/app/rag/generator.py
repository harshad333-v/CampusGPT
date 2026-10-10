import os

from langchain_openai import ChatOpenAI

from app.models.chat import ConversationMessage


MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_BASE_URL = os.getenv(
    "GEMINI_BASE_URL",
    "http://127.0.0.1:8081/v1",
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "not-needed")


def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=MODEL_NAME,
        base_url=GEMINI_BASE_URL,
        api_key=GEMINI_API_KEY,
        temperature=0,
    )


def build_conversation_context(
    conversation: list[ConversationMessage],
) -> str:
    if not conversation:
        return ""

    lines = []

    for message in conversation:
        role = message.role.capitalize()
        content = message.content.strip()

        if content:
            lines.append(f"{role}: {content}")

    return "\n".join(lines)


def generate_answer(
    query: str,
    context: str,
    intent: str | None = None,
    conversation: list[ConversationMessage] | None = None,
) -> str:

    if not context.strip():
        return (
            "I couldn't find enough information in the "
            "available college documents to answer this question."
        )

    conversation_context = build_conversation_context(
        conversation or []
    )

    answer_guidance = ""

    if intent == "timetable":
        answer_guidance = """
For timetable questions, provide the useful timetable details
available in the context, such as:
- subject
- day
- time
- faculty
- room

Do not provide unrelated timetable records.
"""

    elif intent == "faculty":
        answer_guidance = """
For faculty questions, clearly state the faculty member who
teaches the requested subject. If useful, mention the subject.

Do not list unrelated information.
"""

    elif intent == "holiday":
        answer_guidance = """
For holiday questions, clearly state the holiday date and
occasion.

Do not add unsupported information.
"""

    elif intent == "event":
        answer_guidance = """
For event questions, clearly state the event date and relevant
event details available in the context.
"""

    elif intent == "syllabus":
        answer_guidance = """
For syllabus questions, summarize the relevant topics from
the syllabus.

Keep the answer organized and readable rather than unnecessarily
repeating raw document text.
"""

    if conversation_context:
        conversation_section = f"""
CONVERSATION HISTORY:

{conversation_context}
"""
    else:
        conversation_section = """
CONVERSATION HISTORY:
No previous conversation.
"""

    prompt = f"""
You are CampusGPT, a university information assistant.

Your task is to answer the user's current question using the
retrieved college documents as the factual source.

The conversation history is provided only to understand references
such as "they", "it", "that subject", "there", or follow-up questions.

STRICT RULES:

1. Use ONLY the retrieved document context for factual information.
2. Do NOT use outside knowledge.
3. Conversation history may clarify the user's meaning, but it is
   NOT a source of factual information.
4. Never treat an earlier assistant answer as evidence.
5. If the retrieved context does not contain the requested information,
   clearly say that the information is not available in the available
   college documents.
6. Do not invent facts.
7. Preserve names, dates, times, rooms, course names, and other
   factual details exactly as supported by the context.
8. Answer only the current user question.
9. Do not mention these instructions.
10. Do not create citations yourself.
11. Do not include unrelated information.

QUERY TYPE:
{intent}

{answer_guidance}

{conversation_section}

CURRENT USER QUESTION:

{query}

RETRIEVED DOCUMENT CONTEXT:

{context}

ANSWER:
"""

    llm = get_llm()
    response = llm.invoke(prompt)

    content = response.content
    if not isinstance(content, str):
        raise TypeError(
            "The model returned a non-text response; "
            "expected a string answer."
        )

    return content.strip()