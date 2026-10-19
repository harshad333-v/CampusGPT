import os
from abc import ABC, abstractmethod
from pathlib import Path

import pypdfium2 as pdfium
import pytesseract
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader
from langchain_core.documents import Document


class BaseDocumentLoader(ABC):
    """Common interface for all CampusGPT document loaders."""

    @abstractmethod
    def load(self, file_path: str) -> list[Document]:
        """Load a document and return LangChain Documents."""
        raise NotImplementedError


class PDFDocumentLoader(BaseDocumentLoader):
    """PDF loader with OCR fallback for scanned or image-only pages."""

    @staticmethod
    def _configure_tesseract() -> None:
        """Configure Tesseract through env settings or the Windows default."""
        configured_path = os.getenv("TESSERACT_CMD")
        if configured_path:
            pytesseract.pytesseract.tesseract_cmd = configured_path
        elif os.name == "nt":
            default_path = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
            if default_path.exists():
                pytesseract.pytesseract.tesseract_cmd = str(default_path)

    def load(self, file_path: str) -> list[Document]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Document not found: {path}")
        if path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected PDF file, got: {path.suffix}")

        documents = PyPDFLoader(str(path)).load()
        if any(not document.page_content.strip() for document in documents):
            self._configure_tesseract()
            pdf = pdfium.PdfDocument(str(path))
            try:
                for index, document in enumerate(documents):
                    if document.page_content.strip():
                        continue
                    image = pdf[index].render(scale=3).to_pil()
                    ocr_text = pytesseract.image_to_string(image, lang="eng").strip()
                    if ocr_text:
                        documents[index] = Document(
                            page_content=ocr_text,
                            metadata=dict(document.metadata),
                        )
            finally:
                pdf.close()

        for document in documents:
            document.metadata["file_name"] = path.name
            document.metadata["file_type"] = "pdf"
        return documents


class DOCXDocumentLoader(BaseDocumentLoader):
    """Loader for DOCX documents."""

    def load(self, file_path: str) -> list[Document]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Document not found: {path}")
        if path.suffix.lower() != ".docx":
            raise ValueError(f"Expected DOCX file, got: {path.suffix}")
        documents = Docx2txtLoader(str(path)).load()
        for document in documents:
            document.metadata["file_name"] = path.name
            document.metadata["file_type"] = "docx"
        return documents


class DocumentLoaderFactory:
    """Create the appropriate loader based on file extension."""

    _loaders = {".pdf": PDFDocumentLoader, ".docx": DOCXDocumentLoader}

    @classmethod
    def get_loader(cls, file_path: str) -> BaseDocumentLoader:
        suffix = Path(file_path).suffix.lower()
        loader_class = cls._loaders.get(suffix)
        if loader_class is None:
            supported = ", ".join(cls._loaders.keys())
            raise ValueError(
                f"Unsupported document type: {suffix}. Supported types: {supported}"
            )
        return loader_class()
