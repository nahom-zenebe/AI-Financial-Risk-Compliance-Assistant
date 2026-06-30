"""
RAG orchestration service — ties together loader → splitter → embedder → ChromaDB.
"""
import logging
from typing import Optional

from app.rag.loader import load_document
from app.rag.splitter import split_pages
from app.rag.embedder import embed_text, embed_batch
from app.services.chroma_service import add_chunks, query_chunks
from app.core.config import settings

logger = logging.getLogger(__name__)


def ingest_document(
    document_id: int,
    file_path: str,
    filename: str,
    category: str = "general",
) -> int:
    """
    Full ingestion pipeline: load → split → embed → store.
    Returns number of chunks stored.
    """
    # 1. Load raw pages
    pages = load_document(file_path)
    if not pages:
        logger.warning(f"No content extracted from {filename}")
        return 0

    # 2. Split into chunks
    raw_chunks = split_pages(pages)
    if not raw_chunks:
        return 0

    # 3. Batch embed all chunks
    texts = [c["text"] for c in raw_chunks]
    embeddings = embed_batch(texts)

    # 4. Build ChromaDB records
    chroma_chunks = []
    for i, (chunk, emb) in enumerate(zip(raw_chunks, embeddings)):
        chroma_id = f"doc_{document_id}_chunk_{chunk['chunk_index']}"
        chroma_chunks.append({
            "id": chroma_id,
            "text": chunk["text"],
            "embedding": emb,
            "metadata": {
                "document_id": document_id,
                "filename": filename,
                "category": category,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
            },
        })

    # 5. Upsert into ChromaDB
    stored = add_chunks(chroma_chunks)
    logger.info(f"Ingested {stored} chunks for document_id={document_id}")
    return stored


def retrieve_relevant_chunks(
    question: str,
    top_k: int = None,
    document_id: Optional[int] = None,
    category: Optional[str] = None,
) -> list[dict]:
    """
    Embed the question and retrieve top-k relevant chunks from ChromaDB.
    Supports optional metadata filtering by document_id or category.
    """
    top_k = top_k or settings.TOP_K_RESULTS
    query_emb = embed_text(question)

    where = None
    if document_id is not None:
        where = {"document_id": document_id}
    elif category is not None:
        where = {"category": category}

    return query_chunks(query_emb, top_k=top_k, where=where)
