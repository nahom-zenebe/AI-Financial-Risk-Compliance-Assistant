from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    file_size: int
    category: str
    status: str
    chunk_count: int
    summary: Optional[str] = None
    uploaded_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentList(BaseModel):
    total: int
    documents: list[DocumentResponse]
