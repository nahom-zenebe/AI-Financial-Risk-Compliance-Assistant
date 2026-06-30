from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "LOGIN", "UPLOAD_DOCUMENT"
    entity: Mapped[str] = mapped_column(String(100), nullable=True)    # e.g. "Document"
    entity_id: Mapped[str] = mapped_column(String(100), nullable=True) # e.g. "42"
    detail: Mapped[str] = mapped_column(Text, nullable=True)           # JSON or free text
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
