from sqlalchemy import ForeignKey, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class RiskPrediction(Base, TimestampMixin):
    __tablename__ = "risk_predictions"

    id: Mapped[int] = mapped_column(primary_key=True)

    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id")
    )

    risk_score: Mapped[float] = mapped_column(Float)
    prediction: Mapped[str] = mapped_column(String(50))  # low / medium / high

    explanation: Mapped[str] = mapped_column(String)

    model_version: Mapped[str] = mapped_column(String(50))

    transaction = relationship(
        "Transaction",
        back_populates="risk_prediction"
    )