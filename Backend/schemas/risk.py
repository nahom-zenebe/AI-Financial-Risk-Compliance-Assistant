from pydantic import BaseModel
from .common import TimestampSchema


class RiskPredictionCreate(BaseModel):
    transaction_id: int


class RiskPredictionOut(TimestampSchema):
    id: int
    transaction_id: int
    risk_score: float
    prediction: str
    explanation: str
    model_version: str