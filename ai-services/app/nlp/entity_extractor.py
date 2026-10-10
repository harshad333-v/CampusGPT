import re

from app.nlp.schemas import QueryEntities


# ---------------------------------------------------------
# Departments
# ---------------------------------------------------------

DEPARTMENTS = {
    "cse": "CSE",
    "computer science": "CSE",
    "computer science engineering": "CSE",
    "cs": "CSE",

    "it": "IT",
    "information technology": "IT",

    "ece": "ECE",
    "electronics": "ECE",

    "electrical": "EE",
    "ee": "EE",

    "mechanical": "ME",
    "me": "ME",

    "civil": "CE",
    "ce": "CE",
}


# ---------------------------------------------------------
# Days
# ---------------------------------------------------------

DAYS = {
    "monday": "Monday",
    "mon": "Monday",

    "tuesday": "Tuesday",
    "tue": "Tuesday",
    "tues": "Tuesday",

    "wednesday": "Wednesday",
    "wed": "Wednesday",

    "thursday": "Thursday",
    "thu": "Thursday",
    "thur": "Thursday",

    "friday": "Friday",
    "fri": "Friday",

    "saturday": "Saturday",
    "sat": "Saturday",

    "sunday": "Sunday",
    "sun": "Sunday",
}


# ---------------------------------------------------------
# Subjects
# ---------------------------------------------------------
# These values should match the subject names used by the
# timetable/parser as closely as possible.
#
# The dictionary key is what the user may type.
# The value is the canonical subject name stored in metadata.

SUBJECTS = {
    # Theory of Computation
    "toc": "TOC",
    "theory of computation": "TOC",

    # Cryptography
    "cryptography": "CRYPTOGRAPHY",
    "crypto": "CRYPTOGRAPHY",

    # Data Science & Analytics
    "data science": "DATA SCIENCE & ANALYTICS",
    "data science and analytics": "DATA SCIENCE & ANALYTICS",
    "data science & analytics": "DATA SCIENCE & ANALYTICS",

    # Minor Project
    "minor project": "MINOR PROJECT-IV",
    "minor project iv": "MINOR PROJECT-IV",
    "minor project-iv": "MINOR PROJECT-IV",

    # Data Structures and Algorithms
    "data structures and algorithms": "DATA STRUCTURES AND ALGORITHMS",
    "data structures": "DATA STRUCTURES AND ALGORITHMS",
    "dsa": "DATA STRUCTURES AND ALGORITHMS",

    # Object Oriented Programming
    "oops": "OOPS",
    "object oriented programming": "OOPS",
    "object-oriented programming": "OOPS",

    # Database Management System
    "dbms": "DBMS",
    "database management system": "DBMS",

    # Computer System Organisation
    "cso": "CSO",
    "computer system organisation": "CSO",
    "computer system organization": "CSO",

    # Discrete Mathematics
    "discrete mathematics": "DISCRETE MATHEMATICS",
    "discrete math": "DISCRETE MATHEMATICS",
}


# ---------------------------------------------------------
# Document Types
# ---------------------------------------------------------

DOCUMENT_TYPES = {
    "holiday": "HOLIDAY_NOTICE",
    "holidays": "HOLIDAY_NOTICE",
    "chutti": "HOLIDAY_NOTICE",
    "chhutti": "HOLIDAY_NOTICE",
    "vacation": "HOLIDAY_NOTICE",

    "exam": "EXAM_SCHEDULE",
    "examination": "EXAM_SCHEDULE",
    "exam schedule": "EXAM_SCHEDULE",

    "timetable": "TIMETABLE",

    "syllabus": "SYLLABUS",

    "notice": "NOTICE",
    "circular": "CIRCULAR",

    "result": "RESULT",
    "results": "RESULT",

    "fees": "FEE_NOTICE",
    "fee": "FEE_NOTICE",
}


# ---------------------------------------------------------
# Semester Extraction
# ---------------------------------------------------------

def extract_semester(text: str) -> int | None:
    """
    Extract semester numbers from common English/Hinglish forms.

    Examples:
        5th sem
        5th semester
        semester 5
        sem 5
        5 sem
    """

    patterns = [
        r"\b(\d+)(?:st|nd|rd|th)?\s*(?:semester|sem)\b",
        r"\b(?:semester|sem)\s*(\d+)\b",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            semester = int(match.group(1))

            if 1 <= semester <= 20:
                return semester

    return None


# ---------------------------------------------------------
# Department Extraction
# ---------------------------------------------------------

def extract_department(text: str) -> str | None:
    """
    Extract a known department from the query.
    """

    lowered = text.lower()

    # Check longer names first so that:
    # "computer science engineering"
    # is checked before "computer science".
    for name in sorted(
        DEPARTMENTS,
        key=len,
        reverse=True,
    ):
        pattern = rf"\b{re.escape(name)}\b"

        if re.search(pattern, lowered):
            return DEPARTMENTS[name]

    return None


# ---------------------------------------------------------
# Document Type Extraction
# ---------------------------------------------------------

def extract_document_type(text: str) -> str | None:
    """
    Extract the document type relevant to retrieval.
    """

    lowered = text.lower()

    for keyword in sorted(
        DOCUMENT_TYPES,
        key=len,
        reverse=True,
    ):
        if keyword in lowered:
            return DOCUMENT_TYPES[keyword]

    return None


# ---------------------------------------------------------
# Person Name Extraction
# ---------------------------------------------------------

def extract_person_name(text: str) -> str | None:
    """
    Lightweight person-name extraction.

    Handles explicit patterns such as:
        Professor Rahul Sharma
        Prof. Rahul Sharma
        Dr. Rahul Sharma
        Teacher Rahul Sharma
        Faculty Rahul Sharma
    """

    patterns = [
        r"\b(?:professor|prof\.?|teacher|faculty)\s+"
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",

        r"\b(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+"
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
        )

        if match:
            return match.group(1).strip()

    return None


# ---------------------------------------------------------
# Day Extraction
# ---------------------------------------------------------

def extract_day(text: str) -> str | None:
    """
    Extract a weekday from the query.

    Examples:
        Monday
        monday
        Mon
        friday
        Fri
    """

    lowered = text.lower()

    for day, normalized_day in DAYS.items():
        pattern = rf"\b{re.escape(day)}\b"

        if re.search(pattern, lowered):
            return normalized_day

    return None


# ---------------------------------------------------------
# Period Extraction
# ---------------------------------------------------------

def extract_periods(
    text: str,
) -> tuple[int | None, int | None]:
    """
    Extract timetable period numbers.

    Examples:
        period 5
        period 5 and 6
        periods 5 and 6
        periods 5-6
        periods 5 to 6
        period 5-6
    """

    # ---------------------------------------------------------
    # Range / pair
    # ---------------------------------------------------------

    patterns = [
        r"\bperiods?\s+(\d+)\s*(?:and|-|to)\s*(\d+)\b",
        r"\b(\d+)\s*(?:and|-|to)\s*(\d+)\s+periods?\b",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            start = int(match.group(1))
            end = int(match.group(2))

            if 1 <= start <= 20 and 1 <= end <= 20:
                return start, end

    # ---------------------------------------------------------
    # Single period
    # ---------------------------------------------------------

    single_pattern = r"\bperiod\s+(\d+)\b"

    match = re.search(
        single_pattern,
        text,
        re.IGNORECASE,
    )

    if match:
        period = int(match.group(1))

        if 1 <= period <= 20:
            return period, period

    return None, None


# ---------------------------------------------------------
# Subject Extraction
# ---------------------------------------------------------

def extract_subject(text: str) -> str | None:
    """
    Extract a known academic subject from the query.

    The extractor uses a controlled vocabulary so that
    arbitrary words are not incorrectly treated as subjects.

    Examples:
        TOC
        Theory of Computation
        Cryptography
        crypto
        Data Science and Analytics
        DSA
        DBMS
    """

    lowered = text.lower()

    # Check longer subject names first.
    # This prevents:
    #
    # "data science and analytics"
    #
    # from being matched as only:
    #
    # "data science"
    #
    for subject in sorted(
        SUBJECTS,
        key=len,
        reverse=True,
    ):
        pattern = rf"\b{re.escape(subject)}\b"

        if re.search(pattern, lowered):
            return SUBJECTS[subject]

    return None


# ---------------------------------------------------------
# Main Entity Extraction
# ---------------------------------------------------------

def extract_entities(
    text: str,
) -> QueryEntities:
    """
    Extract structured entities used by the CampusGPT
    retrieval layer.
    """

    period_start, period_end = extract_periods(text)

    return QueryEntities(
        department=extract_department(text),
        semester=extract_semester(text),
        document_type=extract_document_type(text),
        person_name=extract_person_name(text),
        day=extract_day(text),
        period_start=period_start,
        period_end=period_end,
        subject=extract_subject(text),
    )