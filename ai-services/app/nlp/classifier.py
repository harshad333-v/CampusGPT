import re

from app.nlp.normalizer import normalize_query
from app.nlp.schemas import NLPResult, QueryEntities


# ---------------------------------------------------------------------------
# GREETING PATTERNS
# ---------------------------------------------------------------------------

GREETING_PATTERNS = {
    "hi",
    "hello",
    "hey",
    "hii",
    "hiii",
    "namaste",
    "नमस्ते",
    "हाय",
    "हेलो",
}


# ---------------------------------------------------------------------------
# DOCUMENT KEYWORDS
# ---------------------------------------------------------------------------
# Broad signals indicating that a query is related to
# university/college information stored in the CampusGPT
# knowledge base.

DOCUMENT_KEYWORDS = {
    # -----------------------------------------------------------------------
    # General academic/document signals
    # -----------------------------------------------------------------------

    "exam",
    "examination",
    "schedule",
    "timetable",

    "holiday",
    "holidays",
    "vacation",

    "syllabus",
    "curriculum",

    "faculty",
    "professor",
    "teacher",
    "lecturer",

    "fees",
    "fee",
    "tuition",

    "admission",
    "attendance",

    "result",
    "results",

    "notice",
    "circular",

    "semester",
    "department",
    "course",
    "subject",

    "college",
    "university",
    "campus",

    # -----------------------------------------------------------------------
    # Syllabus/content signals
    # -----------------------------------------------------------------------

    "topics",
    "topic",
    "covered",
    "contents",
    "content",
    "units",
    "unit",
    "chapters",
    "chapter",
    "modules",
    "module",

    # -----------------------------------------------------------------------
    # Timetable/class signals
    # -----------------------------------------------------------------------

    "class",
    "classes",
    "period",
    "periods",
    "room",
    "rooms",
    "timing",
    "timings",
    "lecture",
    "lectures",
    "lab",
    "labs",
    "practical",

    # -----------------------------------------------------------------------
    # Days
    # -----------------------------------------------------------------------

    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",

    # -----------------------------------------------------------------------
    # Faculty/question signals
    # -----------------------------------------------------------------------

    "teaches",
    "teaching",
    "taught",
    "who teaches",

    # -----------------------------------------------------------------------
    # Event / celebration signals
    # -----------------------------------------------------------------------

    "event",
    "events",
    "celebration",
    "celebrations",
    "function",
    "functions",
    "independence",
    "independence day",
    "15 august",
    "15th august",

    # -----------------------------------------------------------------------
    # Romanized Hindi / Hinglish
    # -----------------------------------------------------------------------

    "chutti",
    "chhutti",
    "chuttiyaan",
    "chhuttiyaan",

    "pariksha",
    "pareeksha",

    "padhai",
    "dakhila",
    "nateeja",
    "suchna",
    "vibhag",
    "avakash",

    # -----------------------------------------------------------------------
    # Hindi
    # -----------------------------------------------------------------------

    "परीक्षा",
    "छुट्टी",
    "अवकाश",
    "शुल्क",
    "प्रवेश",
    "परिणाम",
    "नोटिस",
    "विभाग",
    "सेमेस्टर",
}


# ---------------------------------------------------------------------------
# INTENT KEYWORDS
# ---------------------------------------------------------------------------
# Intent is more specific than DOCUMENT classification.

INTENT_KEYWORDS = {

    # -----------------------------------------------------------------------
    # Timetable / class schedule
    # -----------------------------------------------------------------------

    "timetable": {
        "timetable",
        "class schedule",
        "class timetable",

        "class",
        "classes",

        "period",
        "periods",

        "room",
        "rooms",

        "timing",
        "timings",

        "lecture",
        "lectures",

        "lab",
        "labs",
        "practical",

        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    },

    # -----------------------------------------------------------------------
    # Holidays
    # -----------------------------------------------------------------------

    "holiday": {
        "holiday",
        "holidays",
        "vacation",

        "chutti",
        "chhutti",
        "chuttiyaan",
        "chhuttiyaan",

        "छुट्टी",
        "अवकाश",
    },

    # -----------------------------------------------------------------------
    # Events / celebrations
    # -----------------------------------------------------------------------

    "event": {
        "event",
        "events",
        "celebration",
        "celebrations",
        "function",
        "functions",
        "independence",
        "independence day",
        "15 august",
        "15th august",
    },

    # -----------------------------------------------------------------------
    # Examination schedule
    # -----------------------------------------------------------------------

    "exam_schedule": {
        "exam",
        "examination",
        "exam date",
        "exam schedule",
        "examination schedule",

        "pariksha",
        "pareeksha",
        "परीक्षा",
    },

    # -----------------------------------------------------------------------
    # Syllabus
    # -----------------------------------------------------------------------

    "syllabus": {
        "syllabus",
        "syllabi",
        "curriculum",
        "course structure",

        "topics",
        "topic",

        "covered",

        "contents",
        "content",

        "units",
        "unit",

        "chapters",
        "chapter",

        "modules",
        "module",
    },

    # -----------------------------------------------------------------------
    # Faculty
    # -----------------------------------------------------------------------

    "faculty": {
        "faculty",
        "professor",
        "teacher",
        "lecturer",

        "teaches",
        "teaching",
        "taught",
    },

    # -----------------------------------------------------------------------
    # Fees
    # -----------------------------------------------------------------------

    "fees": {
        "fee",
        "fees",
        "tuition",
        "शुल्क",
    },

    # -----------------------------------------------------------------------
    # Admission
    # -----------------------------------------------------------------------

    "admission": {
        "admission",
        "admissions",
        "dakhila",
        "प्रवेश",
    },

    # -----------------------------------------------------------------------
    # Attendance
    # -----------------------------------------------------------------------

    "attendance": {
        "attendance",
        "उपस्थिति",
    },

    # -----------------------------------------------------------------------
    # Result
    # -----------------------------------------------------------------------

    "result": {
        "result",
        "results",
        "nateeja",
        "परिणाम",
    },
}


# ---------------------------------------------------------------------------
# LANGUAGE DETECTION
# ---------------------------------------------------------------------------

def detect_language(text: str) -> str:
    """
    Lightweight language detection for:

        English
        Hindi
        Hinglish
        Mixed
        Unknown
    """

    if not text:
        return "unknown"

    devanagari = len(
        re.findall(r"[\u0900-\u097F]", text)
    )

    latin = len(
        re.findall(r"[A-Za-z]", text)
    )

    # Hindi + English
    if devanagari > 0 and latin > 0:
        return "mixed"

    # Only Hindi
    if devanagari > 0:
        return "hi"

    # No Latin characters
    if latin == 0:
        return "unknown"

    # -----------------------------------------------------------------------
    # Romanized Hindi / Hinglish markers
    # -----------------------------------------------------------------------

    hinglish_markers = {
        "hai",
        "hain",
        "kab",
        "kya",
        "ka",
        "ki",
        "ke",
        "mein",
        "me",
        "se",
        "ko",
        "par",
        "chahiye",
        "batao",
        "bata",
        "mera",
        "meri",
        "mere",
        "kaise",
        "kahan",
        "kyun",

        "chutti",
        "chhutti",
        "chuttiyaan",
        "chhuttiyaan",

        "pariksha",
        "pareeksha",

        "dakhila",
        "nateeja",
    }

    words = set(
        re.findall(
            r"[a-z]+",
            text.lower(),
        )
    )

    if words & hinglish_markers:
        return "hinglish"

    return "en"


# ---------------------------------------------------------------------------
# INTENT DETECTION
# ---------------------------------------------------------------------------

def detect_intent(text: str) -> str | None:
    """
    Detect the most likely document intent.

    Returns:
        str
            Detected intent.

        None
            No known intent detected.
    """

    lowered = text.lower()

    # -----------------------------------------------------------------------
    # Specific phrases first
    # -----------------------------------------------------------------------

    specific_phrases = {
        "exam schedule": "exam_schedule",
        "exam date": "exam_schedule",
        "examination schedule": "exam_schedule",

        "class schedule": "timetable",
        "class timetable": "timetable",

        "course structure": "syllabus",

        "who teaches": "faculty",

        "independence day": "event",
        "15 august": "event",
        "15th august": "event",
    }

    for phrase, intent in specific_phrases.items():
        if phrase in lowered:
            return intent

    # -----------------------------------------------------------------------
    # Intent priority
    # -----------------------------------------------------------------------
    # Priority prevents overlapping keywords from producing an
    # unexpected intent.

    intent_priority = [
        "holiday",
        "event",
        "exam_schedule",
        "syllabus",
        "faculty",
        "fees",
        "admission",
        "attendance",
        "result",
        "timetable",
    ]

    for intent in intent_priority:

        keywords = INTENT_KEYWORDS[intent]

        for keyword in keywords:

            if keyword in lowered:
                return intent

    return None


# ---------------------------------------------------------------------------
# GREETING DETECTION
# ---------------------------------------------------------------------------

def is_greeting(text: str) -> bool:
    """
    Detect simple greetings without invoking an LLM.
    """

    lowered = text.lower().strip()

    # Exact match
    if lowered in GREETING_PATTERNS:
        return True

    # Handle punctuation:
    #
    # Hi!
    # Hello!!!
    # Hey?
    #
    cleaned = re.sub(
        r"[^\w\s\u0900-\u097F]",
        "",
        lowered,
    ).strip()

    return cleaned in GREETING_PATTERNS


# ---------------------------------------------------------------------------
# DOCUMENT SIGNAL DETECTION
# ---------------------------------------------------------------------------

def contains_document_signal(text: str) -> bool:
    """
    Determine whether the query contains an obvious
    CampusGPT/document-related signal.
    """

    lowered = text.lower()

    return any(
        keyword in lowered
        for keyword in DOCUMENT_KEYWORDS
    )


# ---------------------------------------------------------------------------
# QUERY CLASSIFICATION
# ---------------------------------------------------------------------------

def classify_query(query: str) -> NLPResult:
    """
    Normalize and classify a user query.

    Classification:

        GREETING
            Simple conversational greeting.

        DOCUMENT
            Query likely requires CampusGPT knowledge/RAG.

        UNSUPPORTED
            No obvious campus/document signal.

    Important:
        Entity extraction happens separately in NLPService.
        This function is responsible only for:

            normalization
            language detection
            intent detection
            coarse classification
    """

    # -----------------------------------------------------------------------
    # Step 1: Normalize
    # -----------------------------------------------------------------------

    normalized = normalize_query(query)

    # -----------------------------------------------------------------------
    # Step 2: Language detection
    # -----------------------------------------------------------------------

    language = detect_language(normalized)

    # -----------------------------------------------------------------------
    # Step 3: Greeting detection
    # -----------------------------------------------------------------------

    if is_greeting(normalized):
        return NLPResult(
            original_query=query,
            normalized_query=normalized,
            language=language,
            query_type="GREETING",
            intent="greeting",
            entities=QueryEntities(),
        )

    # -----------------------------------------------------------------------
    # Step 4: Intent detection
    # -----------------------------------------------------------------------

    intent = detect_intent(normalized)

    # -----------------------------------------------------------------------
    # Step 5: Broad document signal
    # -----------------------------------------------------------------------

    has_document_signal = contains_document_signal(
        normalized
    )

    # -----------------------------------------------------------------------
    # Step 6: DOCUMENT
    # -----------------------------------------------------------------------

    if intent or has_document_signal:
        return NLPResult(
            original_query=query,
            normalized_query=normalized,
            language=language,
            query_type="DOCUMENT",
            intent=intent,
            entities=QueryEntities(),
        )

    # -----------------------------------------------------------------------
    # Step 7: UNSUPPORTED
    # -----------------------------------------------------------------------

    return NLPResult(
        original_query=query,
        normalized_query=normalized,
        language=language,
        query_type="UNSUPPORTED",
        intent=None,
        entities=QueryEntities(),
    )