from sqlalchemy import ForeignKey, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base
from models.common import TimestampMixin


class ComplianceReport(Base, TimestampMixin):
    __tablename__ = "compliance_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    score: Mapped[float] = mapped_column(Float)
    violations: Mapped[str] = mapped_column(String)
    summary: Mapped[str] = mapped_column(String)
    recommendations: Mapped[str] = mapped_column(String)

    document = relationship("Document")
