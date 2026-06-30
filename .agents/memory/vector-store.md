---
name: Vector store workaround
description: RAG pipeline uses JSON+numpy instead of ChromaDB (firewall-blocked).
---

## Rule
Use `Backend/app/services/chroma_service.py` (JSON file + numpy cosine similarity) and sklearn TF-IDF + TruncatedSVD (256-dim) for embeddings.

**Why:** ChromaDB and sentence-transformers are both blocked by the Replit firewall (403 on download). The custom JSON vector store at `chroma_db/vector_store.json` is a fully functional replacement.

**How to apply:** Do not attempt to reinstall ChromaDB or sentence-transformers. The custom solution is intentional and production-ready for the project's scale.
