from datetime import datetime
from pydantic import BaseModel


class TimestampSchema(BaseModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True