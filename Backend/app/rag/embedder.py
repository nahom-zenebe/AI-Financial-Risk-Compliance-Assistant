"""
Embedding service — uses sklearn TF-IDF with SVD for dense vectors.
No external heavy models required; all dependencies are already available.
Falls back to hash-based dummy if sklearn unavailable.
"""
import hashlib
import logging
import json
import os
from typing import Optional

logger = logging.getLogger(__name__)

_EMBED_DIM = 256
_vectorizer = None
_svd = None
_is_fitted = False

# Persist vocabulary across restarts
_VOCAB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db", "tfidf_vocab.json")


def _get_pipeline():
    """Lazy-initialise TF-IDF + TruncatedSVD pipeline."""
    global _vectorizer, _svd, _is_fitted
    if _vectorizer is None:
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.decomposition import TruncatedSVD
            _vectorizer = TfidfVectorizer(
                max_features=8000,
                ngram_range=(1, 2),
                sublinear_tf=True,
                strip_accents="unicode",
            )
            _svd = TruncatedSVD(n_components=_EMBED_DIM, random_state=42)
        except ImportError:
            _vectorizer = "dummy"
    return _vectorizer, _svd


def _normalize(vec: list) -> list:
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def _dummy_embedding(text: str) -> list:
    digest = hashlib.sha256(text.encode()).digest()
    repeated = (digest * ((_EMBED_DIM // len(digest)) + 1))[:_EMBED_DIM]
    raw = [float(b) / 255.0 for b in repeated]
    return _normalize(raw)


def fit_on_corpus(texts: list[str]):
    """Fit the TF-IDF + SVD pipeline on the ingested corpus."""
    global _is_fitted
    if not texts:
        return
    vec, svd = _get_pipeline()
    if vec == "dummy":
        return
    try:
        tfidf_matrix = vec.fit_transform(texts)
        if tfidf_matrix.shape[0] < _EMBED_DIM:
            # SVD needs at least n_components rows
            svd.n_components = min(_EMBED_DIM, tfidf_matrix.shape[0] - 1, tfidf_matrix.shape[1] - 1)
        svd.fit(tfidf_matrix)
        _is_fitted = True
        logger.info(f"TF-IDF+SVD fitted on {len(texts)} documents, dim={svd.n_components}")
    except Exception as e:
        logger.warning(f"TF-IDF fit failed: {e}")


def embed_text(text: str) -> list:
    """Return a dense embedding for one text string."""
    return embed_batch([text])[0]


def embed_batch(texts: list[str]) -> list[list]:
    """Embed multiple texts; fits on first call if not already fitted."""
    vec, svd = _get_pipeline()
    if vec == "dummy":
        return [_dummy_embedding(t) for t in texts]

    if not _is_fitted:
        # Fit on the texts we have right now (bootstrap)
        fit_on_corpus(texts)

    if not _is_fitted:
        return [_dummy_embedding(t) for t in texts]

    try:
        tfidf = vec.transform(texts)
        dense = svd.transform(tfidf)
        return [_normalize(row.tolist()) for row in dense]
    except Exception as e:
        logger.warning(f"Embedding transform failed: {e} — using dummy")
        return [_dummy_embedding(t) for t in texts]
