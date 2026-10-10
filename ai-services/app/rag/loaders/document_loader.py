from abc import ABC, abstractmethod
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader


class BaseDocumentLoader(ABC):
    """Common interface for all CampusGPT document loaders."""

    @abstractmethod
    def load(self, file_path: str) -> list[Document]:
        """Load a document and return LangChain Documents."""
        raise NotImplementedError


class PDFDocumentLoader(BaseDocumentLoader):
    """Loader for PDF documents."""

    def load(self, file_path: str) -> list[Document]:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Document not found: {path}")

        if path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected PDF file, got: {path.suffix}")

        loader = PyPDFLoader(str(path))
        documents = loader.load()

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

        loader = Docx2txtLoader(str(path))
        documents = loader.load()

        for document in documents:
            document.metadata["file_name"] = path.name
            document.metadata["file_type"] = "docx"

        return documents


class DocumentLoaderFactory:
    """Create the appropriate loader based on file extension."""

    _loaders = {
        ".pdf": PDFDocumentLoader,
        ".docx": DOCXDocumentLoader,
    }

    @classmethod
    def get_loader(cls, file_path: str) -> BaseDocumentLoader:
        suffix = Path(file_path).suffix.lower()

        loader_class = cls._loaders.get(suffix)

        if loader_class is None:
            supported = ", ".join(cls._loaders.keys())
            raise ValueError(
                f"Unsupported document type: {suffix}. "
                f"Supported types: {supported}"
            )

        return loader_class()