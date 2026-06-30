"""
Reports API — generate PDF and CSV reports.
GET  /reports/pdf   — compliance + risk PDF report
GET  /reports/csv   — transaction CSV export
"""
import io
import csv
import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all transactions as a CSV file."""
    query = db.query(Transaction)
    if current_user.role != "admin":
        query = query.filter(Transaction.user_id == current_user.id)
    transactions = query.order_by(Transaction.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Amount", "Currency", "Sender", "Receiver",
        "Country", "Risk Level", "Risk Score", "Flags", "Created At"
    ])
    for t in transactions:
        flags = t.risk_flags or "[]"
        writer.writerow([
            t.id, t.amount, t.currency, t.sender, t.receiver,
            t.country, t.risk_level or "N/A", t.risk_score or 0,
            flags, t.created_at.isoformat()
        ])

    output.seek(0)
    filename = f"transactions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/pdf")
def generate_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a PDF compliance & risk summary report."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        )

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("Title", parent=styles["Title"], spaceAfter=20)
        story.append(Paragraph("AI Financial Risk & Compliance Report", title_style))
        story.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | User: {current_user.email}",
            styles["Normal"]
        ))
        story.append(Spacer(1, 0.3 * inch))

        # Document summary
        doc_query = db.query(Document)
        tx_query = db.query(Transaction)
        if current_user.role != "admin":
            doc_query = doc_query.filter(Document.uploaded_by == current_user.id)
            tx_query = tx_query.filter(Transaction.user_id == current_user.id)

        total_docs = doc_query.count()
        total_tx = tx_query.count()
        high_risk = tx_query.filter(Transaction.risk_level == "HIGH").count()

        story.append(Paragraph("Executive Summary", styles["Heading2"]))
        summary_data = [
            ["Metric", "Value"],
            ["Total Documents", str(total_docs)],
            ["Total Transactions Analyzed", str(total_tx)],
            ["High-Risk Transactions", str(high_risk)],
            ["Report Date", datetime.utcnow().strftime("%Y-%m-%d")],
        ]
        t = Table(summary_data, colWidths=[3 * inch, 3 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3 * inch))

        # Transaction Risk Table
        story.append(Paragraph("Transaction Risk Analysis", styles["Heading2"]))
        txs = tx_query.order_by(Transaction.created_at.desc()).limit(20).all()
        if txs:
            tx_data = [["ID", "Amount", "Sender→Receiver", "Country", "Risk Level", "Score"]]
            for tx in txs:
                tx_data.append([
                    str(tx.id),
                    f"{tx.currency} {tx.amount:,.0f}",
                    f"{tx.sender[:15]}→{tx.receiver[:15]}",
                    tx.country,
                    tx.risk_level or "N/A",
                    f"{tx.risk_score:.2f}" if tx.risk_score is not None else "N/A",
                ])
            risk_colors = {"HIGH": colors.red, "MEDIUM": colors.orange, "LOW": colors.green}
            tx_table = Table(tx_data, colWidths=[0.5*inch, 1.2*inch, 2*inch, 1.2*inch, 1*inch, 0.7*inch])
            tx_style = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16213e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.lightgrey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("PADDING", (0, 0), (-1, -1), 4),
            ]
            for i, tx in enumerate(txs, 1):
                if tx.risk_level in risk_colors:
                    tx_style.append(("TEXTCOLOR", (4, i), (4, i), risk_colors[tx.risk_level]))
                    tx_style.append(("FONTNAME", (4, i), (4, i), "Helvetica-Bold"))
            tx_table.setStyle(TableStyle(tx_style))
            story.append(tx_table)
        else:
            story.append(Paragraph("No transactions analyzed yet.", styles["Normal"]))

        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph(
            "This report was auto-generated by the AI Financial Risk & Compliance Assistant.",
            styles["Italic"]
        ))

        doc.build(story)
        buffer.seek(0)
        filename = f"compliance_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ImportError:
        return {"error": "reportlab not installed. Run: pip install reportlab"}
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return {"error": str(e)}
