from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.models.chat import ConversationMessage


def get_llm() -> ChatOpenAI:
    """Use the existing Gemini-compatible gateway from environment settings."""

    settings = get_settings()
    return ChatOpenAI(
        model=settings.gemini_model,
        base_url=settings.gemini_base_url,
        api_key=settings.gemini_api_key.get_secret_value(),
        temperature=0,
        timeout=settings.generation_timeout_seconds,
        max_retries=1,
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

    # Resolve relative-day phrases using the campus's local timezone.
    # This provides calendar context only; it is not proof that classes
    # are or are not scheduled on a particular day.
    local_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    tomorrow = local_now.date() + timedelta(days=1)
    calendar_context = (
        f"Current date in India: {local_now.date().isoformat()} "
        f"({local_now.strftime('%A')}). "
        f"Tomorrow in India: {tomorrow.isoformat()} ({tomorrow.strftime('%A')})."
    )

    if intent == "timetable":
        answer_guidance = """
For timetable questions, answer the exact question first and use only relevant timetable evidence.
- If the user asks in Hinglish/Hindi (for example, "kal class hai?"), reply naturally in the same language.
- Understand "kal" as tomorrow, using the calendar context supplied below.
- You may state the calculated weekday, but do not assume that a college is closed merely because it is Sunday.
- If the retrieved timetable has no class listed for that weekday, say that no class is shown/scheduled in the available timetable, and briefly advise checking an official notice for exceptions.
- If the context does not establish whether classes run that day, be transparent about the uncertainty instead of making up a yes/no answer.
- Keep the answer concise and do not repeat generic retrieval disclaimers when a useful qualified answer is possible.
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
12. Answer directly before explaining limitations.
13. Match the user's language and register: English for English, Hindi for Hindi, and natural Romanized Hindi/Hinglish when the user writes that way.
14. Distinguish a calendar fact (such as tomorrow being Sunday) from a university-specific fact (whether classes are actually held). Never present an inference as a confirmed college rule.

CALENDAR CONTEXT (India / Asia-Kolkata):
{calendar_context}

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



def generate_chat_response(
    query: str,
    conversation: list[ConversationMessage] | None = None,
) -> str:
    """Answer greetings and ordinary small-talk without requiring document context."""

    conversation_context = build_conversation_context(conversation or [])
    prompt = f"""
You are CampusGPT, a friendly and helpful university assistant.
Respond naturally to greetings, small talk, thanks, and general conversational
messages. Be concise, warm, and useful. If the user asks for help, ask what they
need and mention that you can help with campus notices, courses, exams, and
other university information. Do not claim facts about the user's university
unless they are supplied in the conversation. If the user asks a factual campus
question, invite them to ask it directly so the document-grounded campus search
can answer it.

Conversation history:
{conversation_context or "No previous conversation."}

Current user message:
{query}

Reply:
"""
    response = get_llm().invoke(prompt)
    content = response.content
    if not isinstance(content, str):
        raise TypeError("The model returned a non-text response; expected a string answer.")
    return content.strip()
