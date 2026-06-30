"""
AI Chat API — RAG-powered Q&A using Gemini + ChromaDB.
Endpoint: POST /chat
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.chat import ChatRequest, ChatResponse, Citation
from app.services.rag_service import retrieve_relevant_chunks
from app.services.gemini_service import build_rag_prompt, generate_response, calculate_confidence
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["AI Chat"])


def _audit(db, user_id, detail=""):
    db.add(AuditLog(user_id=user_id, action="CHAT_REQUEST", entity="Chat", detail=detail))
    db.commit()


@router.post("/", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a compliance question. Retrieves relevant document chunks via RAG,
    builds a Gemini prompt, and returns the AI answer with citations.
    """
    if not payload.question.strip():
        raise HTTPException(400, detail="Question cannot be empty.")

    # 1. Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(
        question=payload.question,
        top_k=payload.top_k,
        document_id=payload.document_id,
        category=payload.category,
    )

    if not chunks:
        _audit(db, current_user.id, f"Q: {payload.question} — no relevant chunks found")
        return ChatResponse(
            question=payload.question,
            answer="No relevant documents found in the knowledge base. Please upload compliance documents first.",
            citations=[],
            confidence_score=0.0,
            model=settings.GEMINI_MODEL,
        )

    # 2. Build prompt and call Gemini
    prompt = build_rag_prompt(payload.question, chunks)
    answer = generate_response(prompt)

    # 3. Build citation objects
    citations = [
        Citation(
            document_name=c["filename"],
            chunk_text=c["text"][:300] + ("..." if len(c["text"]) > 300 else ""),
            page_number=c.get("page_number"),
            relevance_score=round(max(0.0, 1.0 - c.get("score", 1.0)), 3),
        )
        for c in chunks
    ]

    confidence = calculate_confidence(chunks)
    _audit(db, current_user.id, f"Q: {payload.question[:200]}")

    return ChatResponse(
        question=payload.question,
        answer=answer,
        citations=citations,
        confidence_score=confidence,
        model=settings.GEMINI_MODEL,
    )
