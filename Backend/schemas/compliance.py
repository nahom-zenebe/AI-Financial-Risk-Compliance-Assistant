from pydantic import BaseModel
from .common import TimestampSchema


class ComplianceReportOut(TimestampSchema):
    id: int
    document_id: int
    score: float
    violations: str
    summary: str
    recommendations: str