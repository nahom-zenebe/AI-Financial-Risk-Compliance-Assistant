from sqlalchemy import ForeignKey, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base
from models.common import TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10))
    sender: Mapped[str] = mapped_column(String(255))
    receiver: Mapped[str] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(100))

    user = relationship("User", back_populates="transactions")
    risk_prediction = relationship("RiskPrediction", back_populates="transaction", uselist=False)
