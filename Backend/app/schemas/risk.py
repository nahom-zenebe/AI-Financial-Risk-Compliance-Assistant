from typing import Optional, List
from pydantic import BaseModel


class TransactionInput(BaseModel):
    amount: float
    currency: str = "USD"
    sender: str
    receiver: str
    country: str
    transaction_type: str = "wire_transfer"
    description: Optional[str] = None


class RiskAnalysisResponse(BaseModel):
    transaction_id: int
    risk_level: str           # LOW, MEDIUM, HIGH
    risk_score: float         # 0.0 – 1.0
    explanation: str
    flags: List[str]          # triggered rule names
    recommendations: List[str]


class ComplianceCheckRequest(BaseModel):
    document_id: int


class ComplianceCheckResponse(BaseModel):
    document_id: int
    document_name: str
    compliance_score: float
    violations: List[str]
    summary: str
    recommendations: List[str]
