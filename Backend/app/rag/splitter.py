"""
Text splitter — chunk documents into overlapping token-based windows.
Target: 200–500 tokens per chunk.
"""
import re
from app.core.config import settings


def split_pages(pages: list[dict], chunk_size: int = None, overlap: int = None) -> list[dict]:
    """
    Split a list of page dicts into smaller chunks.
    Returns list of dicts: {chunk_index, page_number, text}
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap = overlap or settings.CHUNK_OVERLAP

    chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page.get("page_number", 1)
        text = page.get("text", "").strip()
        if not text:
            continue

        page_chunks = _split_text(text, chunk_size, overlap)
        for chunk_text in page_chunks:
            if chunk_text.strip():
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "text": chunk_text.strip(),
                })
                chunk_index += 1

    return chunks


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Simple word-based chunker with overlap.
    Word count ≈ 0.75 × token count, so chunk_size words ≈ chunk_size*0.75 tokens.
    We use words for simplicity to avoid tiktoken dependency at runtime.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        if end >= len(words):
            break
        start += chunk_size - overlap  # step forward with overlap

    return chunks
