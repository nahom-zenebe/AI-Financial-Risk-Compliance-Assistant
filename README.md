# AI Financial Risk & Compliance Assistant

An AI-powered system for financial document analysis, compliance checking, transaction risk scoring, and intelligent Q&A using RAG (Retrieval-Augmented Generation) with Google Gemini.

---

# 🚀 Project Overview

This system helps financial institutions:

- Upload and manage documents
- Chat with financial regulations using AI
- Detect transaction fraud and risk
- Automatically generate compliance reports
- Analyze financial data using ML + LLMs

---

# 🧠 Core Features

## 1. Authentication & User Management
- User registration & login
- JWT authentication
- Role-based access:
  - Admin
  - Compliance Officer
  - Auditor
- User profile management

---

## 2. Document Management
- Upload PDF, DOCX, CSV files
- View uploaded documents
- Delete documents
- Search documents
- Store document metadata
- Auto document categorization

---

## 3. RAG Knowledge Base
- Parse documents into text
- Semantic chunking
- Generate embeddings
- Store vectors in ChromaDB
- Metadata indexing
- Hybrid search (vector + keyword)
- Source citations in responses
- Document versioning

---

## 4. AI Compliance Chat (RAG + Gemini)
Ask questions like:
- Does this transaction violate AML policy?
- What are KYC requirements?
- Explain this regulation

Features:
- Natural language Q&A
- Context-aware retrieval
- Source citations
- Confidence score
- Conversation history
- Follow-up questions

---

## 5. Transaction Risk Analysis
Upload transaction data and get:

- Risk Level: LOW / MEDIUM / HIGH
- Risk Score (0–1)
- Explanation of prediction
- Highlight suspicious fields

Methods:
- Rule-based detection
- ML-based prediction

---

## 6. Compliance Checker
Analyze financial reports and detect:

- Missing information
- Compliance violations
- Duplicate records
- Inconsistent values
- Invalid formats

Output:
- Compliance report
- Risk score
- Recommendations

---

## 7. Dashboard
Displays:

- Total documents uploaded
- Compliance status overview
- High-risk transactions
- Risk distribution charts
- Recent uploads
- AI usage statistics

---

## 8. Reporting System
Generate:

- PDF reports
- CSV exports
- Compliance summaries
- Audit reports

---

## 9. Machine Learning Models
Used for:

- Fraud detection
- Risk classification
- Anomaly detection

Evaluation metrics:
- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

---

## 10. Backend Architecture
Built with:

- FastAPI
- PostgreSQL
- ChromaDB (Vector DB)
- Redis (Caching / optional)
- Celery (Background tasks)

---

## 🤖 Tech Stack

### Frontend
- React / Next.js

### Backend
- FastAPI

### AI / LLM
- Google Gemini API

### Vector Database
- ChromaDB

### Database
- PostgreSQL

### Cache
- Redis (optional)

### Storage
- Local / AWS S3 / Google Cloud Storage

---

# 📁 Project Structure

```text
app/
│
├── main.py
│
├── api/
│   ├── auth.py
│   ├── users.py
│   ├── documents.py
│   ├── chat.py
│   ├── compliance.py
│   ├── transactions.py
│
├── core/
│   ├── config.py
│   ├── security.py
│   ├── database.py
│
├── models/
│   ├── user.py
│   ├── document.py
│   ├── transaction.py
│   ├── chat.py
│
├── schemas/
│   ├── user.py
│   ├── auth.py
│   ├── document.py
│   ├── chat.py
│
├── services/
│   ├── gemini_service.py
│   ├── embedding_service.py
│   ├── rag_service.py
│   ├── compliance_service.py
│   ├── fraud_service.py
│
├── rag/
│   ├── loader.py
│   ├── splitter.py
│   ├── embedder.py
│   ├── chroma_manager.py
│   ├── retriever.py
│   ├── prompt.py
│
├── ml/
│   ├── fraud_model.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│
├── utils/
│
├── uploads/
│
└── requirements.txt
