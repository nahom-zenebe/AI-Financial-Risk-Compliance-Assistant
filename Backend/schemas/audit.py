from pydantic import BaseModel
from .common import TimestampSchema


class AuditLogCreate(BaseModel):
    action: str
    entity: str
    entity_id: str
    ip_address: str


class AuditLogOut(TimestampSchema):
    id: int
    user_id: int
    action: str
    entity: str
    entity_id: str
    ip_address: str