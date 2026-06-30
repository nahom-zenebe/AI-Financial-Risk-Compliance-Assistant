"""
Dashboard API — aggregated stats and recent activity.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.audit import AuditLog
from app.services.chroma_service import collection_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return high-level dashboard statistics."""
    # Scope to user unless admin
    is_admin = current_user.role == "admin"

    doc_query = db.query(Document)
    tx_query = db.query(Transaction)
    if not is_admin:
        doc_query = doc_query.filter(Document.uploaded_by == current_user.id)
        tx_query = tx_query.filter(Transaction.user_id == current_user.id)

    total_documents = doc_query.count()
    processed_documents = doc_query.filter(Document.status == "processed").count()
    total_transactions = tx_query.count()
    high_risk_count = tx_query.filter(Transaction.risk_level == "HIGH").count()
    medium_risk_count = tx_query.filter(Transaction.risk_level == "MEDIUM").count()
    low_risk_count = tx_query.filter(Transaction.risk_level == "LOW").count()

    # Average risk score
    avg_score = db.query(func.avg(Transaction.risk_score)).scalar()

    # Recent documents
    recent_docs = doc_query.order_by(Document.created_at.desc()).limit(5).all()

    # Recent high-risk transactions
    recent_high_risk = (
        tx_query.filter(Transaction.risk_level == "HIGH")
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    # ChromaDB stats
    chroma = collection_stats()

    return {
        "documents": {
            "total": total_documents,
            "processed": processed_documents,
            "pending": total_documents - processed_documents,
        },
        "transactions": {
            "total": total_transactions,
            "high_risk": high_risk_count,
            "medium_risk": medium_risk_count,
            "low_risk": low_risk_count,
            "average_risk_score": round(avg_score or 0.0, 3),
        },
        "knowledge_base": chroma,
        "recent_uploads": [
            {
                "id": d.id, "title": d.title, "filename": d.filename,
                "category": d.category, "status": d.status,
                "created_at": d.created_at.isoformat(),
            }
            for d in recent_docs
        ],
        "recent_high_risk_transactions": [
            {
                "id": t.id, "amount": t.amount, "currency": t.currency,
                "sender": t.sender, "receiver": t.receiver,
                "country": t.country, "risk_score": t.risk_score,
                "created_at": t.created_at.isoformat(),
            }
            for t in recent_high_risk
        ],
    }


@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return audit logs (admin sees all, others see their own)."""
    query = db.query(AuditLog)
    if current_user.role != "admin":
        query = query.filter(AuditLog.user_id == current_user.id)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "logs": [
            {
                "id": l.id, "action": l.action, "entity": l.entity,
                "entity_id": l.entity_id, "detail": l.detail,
                "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ],
    }
