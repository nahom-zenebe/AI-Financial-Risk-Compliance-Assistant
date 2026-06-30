"""
Vector store service — lightweight JSON + numpy replacement for ChromaDB.
Stores embeddings in a JSON file; uses cosine similarity for retrieval.
No external package firewall-blocked dependencies.
"""
import json
import logging
import os
from typing import Optional

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_STORE_FILE = os.path.join(settings.CHROMA_PERSIST_DIR, "vector_store.json")
_store: Optional[dict] = None   # {id: {text, embedding, metadata}}


def _load_store() -> dict:
    global _store
    if _store is not None:
        return _store
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    if os.path.exists(_STORE_FILE):
        try:
            with open(_STORE_FILE, "r") as f:
                _store = json.load(f)
            logger.info(f"Loaded {len(_store)} vectors from {_STORE_FILE}")
        except Exception as e:
            logger.warning(f"Could not load vector store: {e}")
            _store = {}
    else:
        _store = {}
    return _store


def _save_store():
    try:
        with open(_STORE_FILE, "w") as f:
            json.dump(_store, f)
    except Exception as e:
        logger.error(f"Could not save vector store: {e}")


def add_chunks(chunks: list[dict]) -> int:
    """
    Store chunks in the JSON vector store.
    Each chunk dict must have: id, text, embedding (list[float]), metadata (dict).
    """
    store = _load_store()
    for chunk in chunks:
        store[chunk["id"]] = {
            "text": chunk["text"],
            "embedding": chunk["embedding"],
            "metadata": chunk["metadata"],
        }
    _save_store()
    return len(chunks)


def query_chunks(
    query_embedding: list,
    top_k: int = 5,
    where: Optional[dict] = None,
) -> list[dict]:
    """
    Cosine-similarity search over all stored vectors.
    Optional `where` dict: filter by exact metadata field match.
    Returns list of dicts ordered by similarity (highest first).
    """
    store = _load_store()
    if not store:
        return []

    # Filter by metadata if requested
    candidates = list(store.values())
    if where:
        filtered = []
        for item in candidates:
            meta = item.get("metadata", {})
            if all(meta.get(k) == v for k, v in where.items()):
                filtered.append(item)
        candidates = filtered

    if not candidates:
        return []

    q = np.array(query_embedding, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        q_norm = 1.0
    q = q / q_norm

    scored = []
    for item in candidates:
        emb = np.array(item["embedding"], dtype=np.float32)
        emb_norm = np.linalg.norm(emb) or 1.0
        emb = emb / emb_norm
        similarity = float(np.dot(q, emb))
        scored.append((similarity, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_k]

    results = []
    for sim, item in top:
        meta = item.get("metadata", {})
        results.append({
            "text": item["text"],
            "filename": meta.get("filename", "Unknown"),
            "document_id": meta.get("document_id"),
            "page_number": meta.get("page_number"),
            "category": meta.get("category", "general"),
            "chunk_index": meta.get("chunk_index", 0),
            "score": round(1.0 - sim, 4),  # convert similarity → distance-like for consistency
        })
    return results


def delete_document_chunks(document_id: int) -> int:
    """Remove all chunks for a given document_id from the vector store."""
    store = _load_store()
    to_delete = [k for k, v in store.items()
                 if v.get("metadata", {}).get("document_id") == document_id]
    for k in to_delete:
        del store[k]
    if to_delete:
        _save_store()
    return len(to_delete)


def collection_stats() -> dict:
    """Basic stats about the vector store."""
    store = _load_store()
    return {
        "collection": settings.CHROMA_COLLECTION,
        "total_chunks": len(store),
        "backend": "json-numpy (lightweight)",
    }
