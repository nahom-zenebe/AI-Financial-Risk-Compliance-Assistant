"""
Risk & Compliance API
  POST /risk/analyze        — transaction risk scoring
  POST /risk/compliance     — document compliance check
  GET  /risk/transactions   — list analysed transactions
"""
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.audit import AuditLog
from app.schemas.risk import TransactionInput, RiskAnalysisResponse, ComplianceCheckRequest, ComplianceCheckResponse
from app.services.compliance_service import check_document_compliance

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/risk", tags=["Risk & Compliance"])


# ---------------------------------------------------------------------------
# Rule-based risk engine
# ---------------------------------------------------------------------------

def _analyze_risk(tx: TransactionInput) -> dict:
    """
    Apply rule-based risk scoring.
    Returns: risk_level, risk_score, flags, explanation, recommendations.
    """
    flags = []
    score = 0.0

    # Amount rules
    if tx.amount > 50_000:
        flags.append("HIGH_VALUE_TRANSACTION")
        score += 0.6
    elif tx.amount > 10_000:
        flags.append("MEDIUM_VALUE_TRANSACTION")
        score += 0.3

    # Country risk
    if tx.country in settings.HIGH_RISK_COUNTRIES:
        flags.append(f"HIGH_RISK_COUNTRY: {tx.country}")
        score += 0.5

    # Self-transfer
    if tx.sender.strip().lower() == tx.receiver.strip().lower():
        flags.append("SENDER_EQUALS_RECEIVER")
        score += 0.4

    # Round number (common in structuring)
    if tx.amount % 1000 == 0 and tx.amount >= 5000:
        flags.append("ROUND_AMOUNT_STRUCTURING_RISK")
        score += 0.1

    # Clamp score to 0–1
    score = min(score, 1.0)

    if score >= 0.6:
        level = "HIGH"
    elif score >= 0.3:
        level = "MEDIUM"
    else:
        level = "LOW"

    explanations = {
        "HIGH_VALUE_TRANSACTION": f"Transaction amount ${tx.amount:,.2f} exceeds $50,000 threshold.",
        "MEDIUM_VALUE_TRANSACTION": f"Transaction amount ${tx.amount:,.2f} exceeds $10,000 — CTR filing may be required.",
        f"HIGH_RISK_COUNTRY: {tx.country}": f"Destination country '{tx.country}' is on the high-risk jurisdictions list.",
        "SENDER_EQUALS_RECEIVER": "Sender and receiver are identical — potential self-laundering indicator.",
        "ROUND_AMOUNT_STRUCTURING_RISK": "Round-number amount may indicate structuring to avoid reporting thresholds.",
    }
    explanation = " | ".join(explanations.get(f, f) for f in flags) or "No risk factors detected."

    recommendations = []
    if level == "HIGH":
        recommendations = [
            "File a Suspicious Activity Report (SAR) immediately.",
            "Freeze transaction pending compliance review.",
            "Escalate to AML compliance officer.",
        ]
    elif level == "MEDIUM":
        recommendations = [
            "Perform enhanced due diligence (EDD) on transaction parties.",
            "File Currency Transaction Report (CTR) if applicable.",
            "Document transaction purpose and source of funds.",
        ]
    else:
        recommendations = ["Standard monitoring — no immediate action required."]

    return {
        "risk_level": level,
        "risk_score": round(score, 3),
        "flags": flags,
        "explanation": explanation,
        "recommendations": recommendations,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

def _audit(db, user_id, action, entity_id=None, detail=""):
    db.add(AuditLog(user_id=user_id, action=action, entity="Transaction",
                    entity_id=str(entity_id) if entity_id else None, detail=detail))
    db.commit()


@router.post("/analyze", response_model=RiskAnalysisResponse)
def analyze_transaction(
    payload: TransactionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze a single financial transaction for AML/risk flags."""
    result = _analyze_risk(payload)

    tx = Transaction(
        user_id=current_user.id,
        amount=payload.amount,
        currency=payload.currency,
        sender=payload.sender,
        receiver=payload.receiver,
        country=payload.country,
        transaction_type=payload.transaction_type,
        description=payload.description,
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        risk_explanation=result["explanation"],
        risk_flags=json.dumps(result["flags"]),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    _audit(db, current_user.id, "RISK_ANALYSIS", tx.id,
           f"{payload.sender}→{payload.receiver} ${payload.amount} → {result['risk_level']}")

    return RiskAnalysisResponse(
        transaction_id=tx.id,
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        explanation=result["explanation"],
        flags=result["flags"],
        recommendations=result["recommendations"],
    )


@router.get("/transactions")
def list_transactions(
    skip: int = 0,
    limit: int = 20,
    risk_level: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List previously analyzed transactions."""
    query = db.query(Transaction)
    if current_user.role != "admin":
        query = query.filter(Transaction.user_id == current_user.id)
    if risk_level:
        query = query.filter(Transaction.risk_level == risk_level.upper())
    total = query.count()
    txs = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "transactions": [
        {
            "id": t.id, "amount": t.amount, "currency": t.currency,
            "sender": t.sender, "receiver": t.receiver, "country": t.country,
            "risk_level": t.risk_level, "risk_score": t.risk_score,
            "created_at": t.created_at.isoformat(),
        }
        for t in txs
    ]}


@router.post("/compliance", response_model=ComplianceCheckResponse)
def check_compliance(
    payload: ComplianceCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run AI-powered compliance analysis on an uploaded document."""
    doc = db.query(Document).filter(Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found.")
    if current_user.role != "admin" and doc.uploaded_by != current_user.id:
        raise HTTPException(403, detail="Access denied.")

    result = check_document_compliance(doc.file_path, doc.filename)

    _audit(db, current_user.id, "COMPLIANCE_CHECK", payload.document_id,
           f"Compliance check on {doc.filename} — score: {result['compliance_score']}")

    return ComplianceCheckResponse(
        document_id=doc.id,
        document_name=doc.filename,
        compliance_score=result["compliance_score"],
        violations=result["violations"],
        summary=result["summary"],
        recommendations=result["recommendations"],
    )
