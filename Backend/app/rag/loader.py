"""
Document loaders — extract raw text from PDF, DOCX, and CSV files.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def load_document(file_path: str) -> list[dict]:
    """
    Load a document and return a list of pages/sections.
    Each item: {"page_number": int, "text": str}
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".pdf":
        return _load_pdf(file_path)
    elif ext == ".docx":
        return _load_docx(file_path)
    elif ext == ".csv":
        return _load_csv(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _load_pdf(file_path: str) -> list[dict]:
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page_number": i, "text": text})
        return pages
    except Exception as e:
        logger.error(f"PDF load error: {e}")
        return [{"page_number": 1, "text": ""}]


def _load_docx(file_path: str) -> list[dict]:
    try:
        from docx import Document
        doc = Document(file_path)
        full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return [{"page_number": 1, "text": full_text}]
    except Exception as e:
        logger.error(f"DOCX load error: {e}")
        return [{"page_number": 1, "text": ""}]


def _load_csv(file_path: str) -> list[dict]:
    try:
        import pandas as pd
        df = pd.read_csv(file_path)
        # Convert DataFrame to readable text representation
        text = f"Columns: {', '.join(df.columns.tolist())}\n\n"
        text += df.to_string(index=False, max_rows=500)
        return [{"page_number": 1, "text": text}]
    except Exception as e:
        logger.error(f"CSV load error: {e}")
        return [{"page_number": 1, "text": ""}]
