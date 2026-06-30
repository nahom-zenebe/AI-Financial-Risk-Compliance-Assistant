from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Transaction fields
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    receiver: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50), default="wire_transfer")
    description: Mapped[str] = mapped_column(String(500), nullable=True)

    # Risk analysis results
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)   # LOW, MEDIUM, HIGH
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)       # 0.0 – 1.0
    risk_explanation: Mapped[str] = mapped_column(Text, nullable=True)
    risk_flags: Mapped[str] = mapped_column(Text, nullable=True)          # JSON list of triggered rules

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
