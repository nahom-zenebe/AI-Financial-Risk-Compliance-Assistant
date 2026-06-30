"""
Gemini LLM service — wraps Google Generative AI for chat and compliance tasks.
"""
import os
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    """Return a configured Gemini GenerativeModel, or None if no API key."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(settings.GEMINI_MODEL)
    except Exception as e:
        logger.warning(f"Gemini client init failed: {e}")
        return None


def generate_response(prompt: str) -> str:
    """
    Send a prompt to Gemini and return the text response.
    Falls back to a stub message if the API key is missing.
    """
    model = _get_client()
    if model is None:
        return (
            "[Gemini API key not configured] — "
            "Set GEMINI_API_KEY in your .env to enable AI responses.\n\n"
            f"Prompt received: {prompt[:300]}..."
        )
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini generate_content error: {e}")
        return f"AI generation failed: {str(e)}"


def build_rag_prompt(question: str, context_chunks: list[dict]) -> str:
    """Build the RAG prompt from retrieved chunks."""
    context_text = ""
    for i, chunk in enumerate(context_chunks, 1):
        doc_name = chunk.get("filename", "Unknown")
        page = chunk.get("page_number", "N/A")
        text = chunk.get("text", "")
        context_text += f"\n[Source {i}: {doc_name}, Page {page}]\n{text}\n"

    return f"""SYSTEM:
You are a financial compliance AI assistant. Answer questions using ONLY the provided context.
If you cannot find the answer in the context, say "Insufficient information in provided documents."
Always cite your sources by referencing Source numbers.

CONTEXT:
{context_text}

QUESTION:
{question}

RULES:
- Use only the provided context above
- If unsure, say "insufficient information"
- Always cite sources (e.g., "According to Source 1...")
- Be concise and professional

ANSWER:"""


def build_compliance_prompt(document_text: str, filename: str) -> str:
    """Build a compliance analysis prompt."""
    return f"""SYSTEM:
You are a financial compliance expert. Analyze the following document for compliance issues.

DOCUMENT: {filename}

CONTENT:
{document_text[:4000]}

TASK:
1. Identify any compliance violations or issues
2. Check for: missing required fields, inconsistent values, suspicious terms, duplicate records
3. Assign a compliance score from 0 (non-compliant) to 1 (fully compliant)
4. Provide specific recommendations

Respond in this exact JSON format:
{{
  "compliance_score": 0.85,
  "violations": ["violation 1", "violation 2"],
  "summary": "Brief overall summary",
  "recommendations": ["recommendation 1", "recommendation 2"]
}}

ANALYSIS:"""


def calculate_confidence(chunks: list[dict]) -> float:
    """Estimate answer confidence from chunk relevance scores."""
    if not chunks:
        return 0.0
    scores = [c.get("score", 0.0) for c in chunks]
    avg = sum(scores) / len(scores)
    # Normalize: ChromaDB distance (lower = better). Convert to 0-1 confidence.
    confidence = max(0.0, min(1.0, 1.0 - avg))
    return round(confidence, 3)
