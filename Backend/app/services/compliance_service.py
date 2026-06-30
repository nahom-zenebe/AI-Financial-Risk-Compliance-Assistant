"""
Compliance checker — analyses a document for policy violations using Gemini.
"""
import json
import logging

from app.services.gemini_service import generate_response, build_compliance_prompt
from app.rag.loader import load_document

logger = logging.getLogger(__name__)


def check_document_compliance(file_path: str, filename: str) -> dict:
    """
    Run a full compliance check on a document.
    Returns: compliance_score, violations, summary, recommendations.
    """
    # Load raw text
    pages = load_document(file_path)
    full_text = "\n".join(p["text"] for p in pages)

    if not full_text.strip():
        return {
            "compliance_score": 0.0,
            "violations": ["Document appears to be empty or unreadable."],
            "summary": "Could not extract text from document.",
            "recommendations": ["Re-upload the document in a supported format."],
        }

    prompt = build_compliance_prompt(full_text, filename)
    raw_response = generate_response(prompt)

    # Try to parse JSON from Gemini's response
    try:
        # Extract JSON block if wrapped in markdown fences
        text = raw_response
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())
        return {
            "compliance_score": float(result.get("compliance_score", 0.5)),
            "violations": result.get("violations", []),
            "summary": result.get("summary", ""),
            "recommendations": result.get("recommendations", []),
        }
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"Could not parse Gemini compliance JSON: {e}")
        # Fall back to returning the raw text
        return {
            "compliance_score": 0.5,
            "violations": ["Could not parse AI response — review manually."],
            "summary": raw_response[:500],
            "recommendations": ["Configure GEMINI_API_KEY for full AI-powered compliance analysis."],
        }


def rule_based_compliance_check(text: str) -> list[str]:
    """
    Quick rule-based violation detection (no LLM required).
    Returns list of violation strings.
    """
    violations = []
    text_lower = text.lower()

    suspicious_terms = [
        "money laundering", "terrorist financing", "fraud", "bribery",
        "kickback", "shell company", "offshore account", "bearer shares"
    ]
    for term in suspicious_terms:
        if term in text_lower:
            violations.append(f"Suspicious term detected: '{term}'")

    if len(text.strip()) < 100:
        violations.append("Document content is too short — may be missing required information.")

    return violations
