from pydantic import BaseModel
from typing import Optional
from .common import TimestampSchema


class TransactionCreate(BaseModel):
    amount: float
    currency: str
    sender: str
    receiver: str
    country: str


class TransactionOut(TimestampSchema):
    id: int
    user_id: int
    amount: float
    currency: str
    sender: str
    receiver: str
    country: str