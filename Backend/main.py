import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.database import Base, engine
import models.user
import models.document
import models.document_chunk
import models.transaction
import models.risk
import models.chat
import models.compliance
import models.audit

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Financial Risk & Compliance Assistant",
    description="API for document management, RAG knowledge base, transaction risk analysis, and compliance reporting.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Financial Risk & Compliance Assistant API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
