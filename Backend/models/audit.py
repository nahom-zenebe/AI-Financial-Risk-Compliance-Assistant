from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base
from models.common import TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(255))
    entity: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(100))
    ip_address: Mapped[str] = mapped_column(String(50))
