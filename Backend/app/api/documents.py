"""
Documents API — upload, list, get, delete. Triggers RAG ingestion on upload.
"""
import os
import shutil
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.audit import AuditLog
from app.schemas.document import DocumentResponse, DocumentList
from app.services.rag_service import ingest_document
from app.services.chroma_service import delete_document_chunks

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/csv": "csv",
    "application/octet-stream": None,  # resolved by extension
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".csv"}


def _audit(db, user_id, action, entity_id=None, detail=""):
    db.add(AuditLog(user_id=user_id, action=action, entity="Document",
                    entity_id=str(entity_id) if entity_id else None, detail=detail))
    db.commit()


def _ingest_background(document_id: int, file_path: str, filename: str, category: str, db_url: str):
    """Background task: ingest document into ChromaDB and update status."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.document import Document as Doc

    real_url = db_url.replace("postgres://", "postgresql://", 1) if db_url.startswith("postgres://") else db_url
    engine = create_engine(real_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        count = ingest_document(document_id, file_path, filename, category)
        doc = session.query(Doc).filter(Doc.id == document_id).first()
        if doc:
            doc.status = "processed"
            doc.chunk_count = count
            session.commit()
    except Exception as e:
        logger.error(f"Ingestion failed for doc {document_id}: {e}")
        doc = session.query(Doc).filter(Doc.id == document_id).first()
        if doc:
            doc.status = "failed"
            session.commit()
    finally:
        session.close()


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form(default="general"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF, DOCX, or CSV. Triggers async RAG ingestion."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}")

    # Check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(400, detail=f"File too large ({size_mb:.1f} MB). Max: {settings.MAX_FILE_SIZE_MB} MB")

    # Save to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"{current_user.id}_{file.filename.replace(' ', '_')}"
    dest = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest, "wb") as f:
        f.write(content)

    # Persist metadata
    doc = Document(
        title=Path(file.filename).stem,
        filename=file.filename,
        file_path=dest,
        file_type=ext.lstrip("."),
        file_size=len(content),
        category=category,
        status="pending",
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Kick off ingestion in background
    background_tasks.add_task(
        _ingest_background, doc.id, dest, file.filename, category, settings.DATABASE_URL
    )

    _audit(db, current_user.id, "UPLOAD_DOCUMENT", doc.id, f"Uploaded {file.filename}")
    return doc


@router.get("/", response_model=DocumentList)
def list_documents(
    skip: int = 0,
    limit: int = 20,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List uploaded documents with optional category filter."""
    query = db.query(Document)
    # Admins see all; others see only their own
    if current_user.role != "admin":
        query = query.filter(Document.uploaded_by == current_user.id)
    if category:
        query = query.filter(Document.category == category)

    total = query.count()
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return DocumentList(total=total, documents=docs)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a single document by ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found.")
    if current_user.role != "admin" and doc.uploaded_by != current_user.id:
        raise HTTPException(403, detail="Access denied.")
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a document and its ChromaDB chunks."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found.")
    if current_user.role != "admin" and doc.uploaded_by != current_user.id:
        raise HTTPException(403, detail="Access denied.")

    # Remove from vector store
    removed = delete_document_chunks(document_id)
    logger.info(f"Removed {removed} chunks for doc {document_id}")

    # Remove file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    _audit(db, current_user.id, "DELETE_DOCUMENT", doc.id, f"Deleted {doc.filename}")
    db.delete(doc)
    db.commit()
