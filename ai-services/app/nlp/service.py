from app.nlp.classifier import classify_query
from app.nlp.entity_extractor import extract_entities
from app.nlp.schemas import NLPResult


class NLPService:
    """
    Coordinates the NLP pipeline.

    Pipeline:
        normalization
            ↓
        language detection
            ↓
        query classification
            ↓
        entity extraction
    """

    def analyze(self, query: str) -> NLPResult:
        result = classify_query(query)

        entities = extract_entities(result.normalized_query)

        result.entities = entities

        return result