from pydantic import BaseModel


class DocumentChunkOut(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    chroma_id: str
    page_number: int

    class Config:
        from_attributes = True