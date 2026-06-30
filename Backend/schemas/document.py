from pydantic import BaseModel
from typing import Optional
from .common import TimestampSchema


class DocumentCreate(BaseModel):
    title: str
    category: str


class DocumentOut(TimestampSchema):
    id: int
    title: str
    filename: str
    file_path: str
    category: str
    status: str
    uploaded_by: int