import re
from pathlib import Path

import pdfplumber
from langchain_core.documents import Document


# ============================================================================
# TIMETABLE CONFIGURATION
# ============================================================================

PERIODS = {
    1: "9:20 - 10:10",
    2: "10:10 - 11:00",
    3: "11:00 - 11:50",
    4: "11:50 - 12:40",
    5: "1:40 - 2:30",
    6: "2:30 - 3:20",
}

DAYS = {
    "Mo": "Monday",
    "Tu": "Tuesday",
    "We": "Wednesday",
    "Th": "Thursday",
    "Fr": "Friday",
}

COLUMN_TO_PERIOD = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    6: 5,
    7: 6,
}


# ============================================================================
# TIMETABLE PDF DETECTION
# ============================================================================

def is_timetable_pdf(file_path: str) -> bool:
    """
    Detect whether a PDF is a timetable.

    Detection uses both filename and PDF text.

    Returns:
        True  -> timetable PDF
        False -> normal PDF
    """

    path = Path(file_path)

    if not path.exists():
        return False

    if path.suffix.lower() != ".pdf":
        return False

    filename = path.name.lower()

    # ------------------------------------------------------------------------
    # Strong filename indicators
    # ------------------------------------------------------------------------

    timetable_keywords = [
        "timetable",
        "time_table",
        "time-table",
        "schedule",
    ]

    if any(
        keyword in filename
        for keyword in timetable_keywords
    ):
        return True

    # ------------------------------------------------------------------------
    # Inspect PDF text
    # ------------------------------------------------------------------------

    try:

        with pdfplumber.open(str(path)) as pdf:

            text_parts = []

            # Usually the timetable information is on the first page.
            for page in pdf.pages[:2]:

                text = page.extract_text() or ""

                text_parts.append(text)

            text = "\n".join(text_parts).lower()

    except Exception:
        return False

    # ------------------------------------------------------------------------
    # Timetable-specific indicators
    # ------------------------------------------------------------------------

    indicators = [
        "aSc timetables",
        "session july-dec",
        "w.e.f",
        "9:20 - 10:10",
        "10:10 - 11:00",
        "11:00 - 11:50",
        "11:50 - 12:40",
        "1:40 - 2:30",
        "2:30 - 3:20",
    ]

    matched = sum(
        indicator.lower() in text
        for indicator in indicators
    )

    # Require multiple timetable characteristics.
    return matched >= 2


# ============================================================================
# TEXT NORMALIZATION
# ============================================================================

def normalize_whitespace(text: str) -> str:
    """
    Collapse repeated whitespace and remove leading/trailing whitespace.
    """

    if not text:
        return ""

    return re.sub(r"\s+", " ", str(text)).strip()


def normalize_course_code(text: str) -> str:
    """
    Normalize course codes split by PDF extraction.

    Examples:
        CSL 0509 -> CSL0509
        CSE 0521 -> CSE0521
        CSD 0503 -> CSD0503
    """

    if not text:
        return ""

    return re.sub(
        r"\b([A-Z]{2,5})\s+(\d{4})\b",
        r"\1\2",
        text,
        flags=re.IGNORECASE,
    )


def normalize_day_code(text: str) -> str | None:
    """
    Normalize timetable day codes.

    Example:
        " Mo " -> "Mo"
    """

    text = normalize_whitespace(text)

    if not text:
        return None

    return text[:2].title()


# ============================================================================
# CLASS / BATCH EXTRACTION
# ============================================================================

def extract_class_name(page_text: str) -> str | None:
    """
    Extract class/batch name from timetable header.

    Example:
        Session July-Dec 26
        B.Tech-V(B)
        W.E.F 24th Aug 2026

    Returns:
        B.Tech-V(B)
    """

    if not page_text:
        return None

    lines = [
        normalize_whitespace(line)
        for line in page_text.splitlines()
        if normalize_whitespace(line)
    ]

    # Search near Session line.
    for index, line in enumerate(lines):

        if line.lower().startswith("session"):

            for candidate in lines[index + 1:index + 5]:

                if re.search(
                    r"\b(?:B\.?\s*Tech|M\.?\s*Tech|BCA|MCA)\b",
                    candidate,
                    flags=re.IGNORECASE,
                ):
                    return candidate

    # Fallback.
    for line in lines:

        if re.search(
            r"\b(?:B\.?\s*Tech|M\.?\s*Tech|BCA|MCA)\b",
            line,
            flags=re.IGNORECASE,
        ):
            return line

    return None


def extract_session(page_text: str) -> str | None:
    """
    Extract timetable session.

    Example:
        Session July-Dec 26

    Returns:
        July-Dec 26
    """

    if not page_text:
        return None

    for line in page_text.splitlines():

        line = normalize_whitespace(line)

        match = re.match(
            r"Session\s+(.+)",
            line,
            flags=re.IGNORECASE,
        )

        if match:
            return normalize_whitespace(
                match.group(1)
            )

    return None


def extract_effective_date(page_text: str) -> str | None:
    """
    Extract W.E.F date.

    Example:
        W.E.F 24th Aug 2026
    """

    if not page_text:
        return None

    for line in page_text.splitlines():

        line = normalize_whitespace(line)

        match = re.match(
            r"W\.?E\.?F\.?\s+(.+)",
            line,
            flags=re.IGNORECASE,
        )

        if match:
            return normalize_whitespace(
                match.group(1)
            )

    return None


# ============================================================================
# ROOM EXTRACTION
# ============================================================================

def extract_room(
    text: str,
) -> tuple[str | None, str]:

    if not text:
        return None, ""

    text = normalize_whitespace(text)

    pattern = re.compile(
        r"^(MGSF\s+LAB-[A-Z0-9]+|MG-\d+(?:\s+Lab)?)"
        r"(?:\s+|$)",
        flags=re.IGNORECASE,
    )

    match = pattern.match(text)

    if not match:
        return None, text

    room = normalize_whitespace(
        match.group(1)
    )

    remaining = text[
        match.end():
    ].strip()

    return room, remaining


# ============================================================================
# CELL PARSER
# ============================================================================

def parse_cell(cell_text: str) -> dict:
    """
    Parse one timetable cell.

    Expected structure:

        ROOM
        SUBJECT(CODE)
        FACULTY
    """

    text = normalize_whitespace(
        cell_text
    )

    if not text:
        return {}

    text = normalize_course_code(text)

    room, text = extract_room(text)

    text = normalize_course_code(text)

    # ------------------------------------------------------------------------
    # Find subject + course code + faculty.
    #
    # IMPORTANT:
    # Do not require the course code to be immediately at the beginning.
    # ------------------------------------------------------------------------

    course_match = re.search(
        r"(?P<subject>.*?)"
        r"\(\s*(?P<code>[A-Z]{2,5}\d{4})\s*\)"
        r"\s*(?P<faculty>.*)$",
        text,
        flags=re.IGNORECASE,
    )

    if not course_match:

        return {
            "room": room,
            "raw_text": text,
        }

    subject = normalize_whitespace(
        course_match.group("subject")
    )

    course_code = (
        course_match
        .group("code")
        .upper()
        .replace(" ", "")
    )

    faculty = normalize_whitespace(
        course_match.group("faculty")
    )

    return {
        "subject": subject,
        "course_code": course_code,
        "faculty": faculty or None,
        "room": room,
        "raw_text": text,
    }


# ============================================================================
# CELL HELPERS
# ============================================================================

def is_empty_cell(cell) -> bool:
    """
    Determine whether a timetable cell is empty.
    """

    if cell is None:
        return True

    return not normalize_whitespace(
        str(cell)
    )


def get_cell_span(
    row: list,
    column_index: int,
) -> list[int]:

    if column_index not in COLUMN_TO_PERIOD:
        return []

    start_period = COLUMN_TO_PERIOD[
        column_index
    ]

    periods = [start_period]

    for next_column in range(
        column_index + 1,
        len(row),
    ):

        # Lunch boundary.
        if next_column == 5:
            break

        if next_column not in COLUMN_TO_PERIOD:
            continue

        next_cell = row[next_column]

        if not is_empty_cell(next_cell):
            break

        periods.append(
            COLUMN_TO_PERIOD[next_column]
        )

    return periods


# ============================================================================
# PERIOD FORMATTING
# ============================================================================

def format_period_range(
    periods: list[int],
) -> tuple[str, str]:

    if not periods:
        return "", ""

    periods = sorted(
        set(periods)
    )

    start = periods[0]
    end = periods[-1]

    if start == end:

        return (
            f"Period {start}",
            PERIODS[start],
        )

    start_time = PERIODS[start].split(
        " - "
    )[0]

    end_time = PERIODS[end].split(
        " - "
    )[1]

    return (
        f"Periods {start}-{end}",
        f"{start_time} - {end_time}",
    )


# ============================================================================
# DUPLICATE DETECTION
# ============================================================================

def make_record_key(
    day: str,
    periods: list[int],
    subject: str,
    course_code: str | None,
    faculty: str | None,
    room: str | None,
) -> tuple:

    return (
        day,
        tuple(sorted(periods)),
        normalize_whitespace(
            subject
        ).lower(),
        normalize_whitespace(
            course_code or ""
        ).lower(),
        normalize_whitespace(
            faculty or ""
        ).lower(),
        normalize_whitespace(
            room or ""
        ).lower(),
    )
# ============================================================================
# TIMETABLE PDF DETECTION
# ============================================================================

def is_timetable_pdf(file_path: str) -> bool:
    """
    Determine whether a PDF is a timetable.

    The detector checks extracted PDF text for timetable-specific
    markers such as:
        - Session
        - B.Tech / BCA / MCA
        - W.E.F
        - timetable period timings
        - day headers
    """

    path = Path(file_path)

    if not path.exists():
        return False

    if path.suffix.lower() != ".pdf":
        return False

    try:
        with pdfplumber.open(str(path)) as pdf:

            # Check a limited number of pages.
            # Timetables are normally identified from the first page.
            for page in pdf.pages[:3]:

                text = page.extract_text() or ""

                if not text:
                    continue

                normalized = normalize_whitespace(
                    text
                ).lower()

                # ------------------------------------------------------------
                # Strong timetable indicators
                # ------------------------------------------------------------

                strong_markers = [
                    "session july-dec",
                    "w.e.f",
                    "aSc timetables",
                    "9:20 - 10:10",
                    "10:10 - 11:00",
                    "11:00 - 11:50",
                    "11:50 - 12:40",
                    "1:40 - 2:30",
                    "2:30 - 3:20",
                ]

                strong_matches = sum(
                    marker in normalized
                    for marker in strong_markers
                )

                # ------------------------------------------------------------
                # Day markers
                # ------------------------------------------------------------

                day_matches = sum(
                    day in text
                    for day in ["Mo", "Tu", "We", "Th", "Fr"]
                )

                # ------------------------------------------------------------
                # Class markers
                # ------------------------------------------------------------

                has_class = bool(
                    re.search(
                        r"\b(?:B\.?\s*Tech|M\.?\s*Tech|BCA|MCA)\b",
                        text,
                        flags=re.IGNORECASE,
                    )
                )

                # ------------------------------------------------------------
                # Decision
                # ------------------------------------------------------------

                if strong_matches >= 2:
                    return True

                if strong_matches >= 1 and day_matches >= 3 and has_class:
                    return True

    except Exception:
        return False

    return False

# ============================================================================
# TIMETABLE PARSER
# ============================================================================

def parse_timetable(
    file_path: str,
) -> list[Document]:

    path = Path(file_path)

    if not path.exists():

        raise FileNotFoundError(
            f"Timetable not found: {path}"
        )

    if path.suffix.lower() != ".pdf":

        raise ValueError(
            "Timetable parser currently supports PDF only."
        )

    records: list[Document] = []

    seen_records: set[tuple] = set()

    with pdfplumber.open(str(path)) as pdf:

        for page_number, page in enumerate(
            pdf.pages,
            start=1,
        ):

            # =================================================================
            # HEADER
            # =================================================================

            page_text = page.extract_text() or ""

            class_name = extract_class_name(
                page_text
            )

            session = extract_session(
                page_text
            )

            effective_date = (
                extract_effective_date(
                    page_text
                )
            )

            # =================================================================
            # TABLE EXTRACTION
            # =================================================================

            tables = page.extract_tables()

            if not tables:
                continue

            # -------------------------------------------------------------
            # Find the table that actually contains timetable days.
            # Do NOT blindly assume tables[0].
            # -------------------------------------------------------------

            table = None

            for candidate in tables:

                if not candidate:
                    continue

                has_day = False

                for row in candidate:

                    if not row:
                        continue

                    first_cell = row[0]

                    if is_empty_cell(first_cell):
                        continue

                    day_code = normalize_day_code(
                        str(first_cell)
                    )

                    if day_code in DAYS:
                        has_day = True
                        break

                if has_day:
                    table = candidate
                    break

            if table is None:
                continue

            # =================================================================
            # PROCESS ROWS
            # =================================================================

            for row in table:

                if not row:
                    continue

                if len(row) < 2:
                    continue

                # -------------------------------------------------------------
                # Day
                # -------------------------------------------------------------

                day_code = row[0]

                if is_empty_cell(day_code):
                    continue

                day_code = normalize_day_code(
                    str(day_code)
                )

                if day_code not in DAYS:
                    continue

                day = DAYS[day_code]

                # =================================================================
                # PROCESS COLUMNS
                # =================================================================

                for column_index, cell in enumerate(row):

                    if column_index == 0:
                        continue

                    # Lunch.
                    if column_index == 5:
                        continue

                    if column_index not in COLUMN_TO_PERIOD:
                        continue

                    if is_empty_cell(cell):
                        continue

                    cell_text = normalize_whitespace(
                        str(cell)
                    )

                    if not cell_text:
                        continue

                    # ---------------------------------------------------------
                    # Determine period span.
                    # ---------------------------------------------------------

                    periods = get_cell_span(
                        row,
                        column_index,
                    )

                    if not periods:
                        continue

                    # ---------------------------------------------------------
                    # Parse cell.
                    # ---------------------------------------------------------

                    parsed = parse_cell(
                        cell_text
                    )

                    subject = parsed.get(
                        "subject"
                    )

                    if not subject:
                        continue

                    course_code = parsed.get(
                        "course_code"
                    )

                    faculty = parsed.get(
                        "faculty"
                    )

                    room = parsed.get(
                        "room"
                    )

                    # ---------------------------------------------------------
                    # Duplicate detection.
                    # ---------------------------------------------------------

                    record_key = make_record_key(
                        day=day,
                        periods=periods,
                        subject=subject,
                        course_code=course_code,
                        faculty=faculty,
                        room=room,
                    )

                    if record_key in seen_records:
                        continue

                    seen_records.add(
                        record_key
                    )

                    # =================================================================
                    # PERIOD
                    # =================================================================

                    period_label, time_range = (
                        format_period_range(
                            periods
                        )
                    )

                    # =================================================================
                    # RETRIEVAL CONTENT
                    # =================================================================

                    content = (
                        f"Class: "
                        f"{class_name or 'Unknown'}\n"
                        f"Session: "
                        f"{session or 'Unknown'}\n"
                        f"Effective From: "
                        f"{effective_date or 'Unknown'}\n"
                        f"Day: "
                        f"{day}\n"
                        f"{period_label}: "
                        f"{time_range}\n"
                        f"Subject: "
                        f"{subject}\n"
                        f"Course Code: "
                        f"{course_code or 'Unknown'}\n"
                        f"Faculty: "
                        f"{faculty or 'Unknown'}\n"
                        f"Room: "
                        f"{room or 'Unknown'}"
                    )

                    # =================================================================
                    # METADATA
                    # =================================================================

                    metadata = {
                        "source": str(path),
                        "file_name": path.name,
                        "file_type": "timetable",

                        "page": page_number,

                        "class_name": class_name,
                        "session": session,
                        "effective_date": effective_date,

                        "day": day,

                        "period_start": periods[0],
                        "period_end": periods[-1],
                        "periods": periods,

                        "time_range": time_range,

                        "subject": subject,
                        "course_code": course_code,
                        "faculty": faculty,
                        "room": room,
                    }

                    records.append(
                        Document(
                            page_content=content,
                            metadata=metadata,
                        )
                    )

    return records