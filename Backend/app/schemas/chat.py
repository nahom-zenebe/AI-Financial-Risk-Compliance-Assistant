from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    document_id: Optional[int] = None   # filter RAG to specific document
    category: Optional[str] = None      # filter by category
    top_k: int = 5


class Citation(BaseModel):
    document_name: str
    chunk_text: str
    page_number: Optional[int] = None
    relevance_score: float


class ChatResponse(BaseModel):
    question: str
    answer: str
    citations: list[Citation]
    confidence_score: float
    model: str
