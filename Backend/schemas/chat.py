from pydantic import BaseModel
from typing import List, Optional
from .common import TimestampSchema


class ChatSessionCreate(BaseModel):
    title: str


class ChatSessionOut(TimestampSchema):
    id: int
    user_id: int
    title: str


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageOut(TimestampSchema):
    id: int
    session_id: int
    role: str
    message: str
    citations: Optional[str] = None