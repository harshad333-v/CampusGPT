FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Tesseract is the system OCR engine; pytesseract is pinned in requirements.txt.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip \
    && pip install -r requirements.txt

COPY app ./app

# Run as an unprivileged user in the container.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/chroma_db \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
