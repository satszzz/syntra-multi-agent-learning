import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.models.schemas import DocumentMeta, DocumentQueryRequest, DocumentQueryResponse, DocumentChunkReference
from app.auth.security import get_current_user
from app.database.db import get_collection
from app.config.settings import settings
from app.rag.rag_engine import rag_engine
from app.agents.llm_client import llm_client

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

@router.post("/upload", response_model=DocumentMeta)
async def upload_document(
    file: UploadFile = File(...),
    subject: Optional[str] = Form("Computer Networks"),
    current_user: dict = Depends(get_current_user)
):
    docs_col = get_collection("documents")
    
    # Check extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF or TXT files."
        )

    doc_id = str(uuid.uuid4())
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user["_id"])
    os.makedirs(user_upload_dir, exist_ok=True)
    
    saved_path = os.path.join(user_upload_dir, f"{doc_id}_{filename}")
    
    # Save file to disk
    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(saved_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text and chunk
    try:
        if ext == ".pdf":
            pages = rag_engine.extract_text_from_pdf(saved_path)
            total_pages = len(pages)
        else:
            pages = rag_engine.extract_text_from_txt(saved_path)
            total_pages = 1
            
        chunks = rag_engine.chunk_text(pages, chunk_size=400, chunk_overlap=80)
        
        # Ingest to ChromaDB
        rag_engine.ingest_document(
            document_id=doc_id,
            user_id=current_user["_id"],
            filename=filename,
            subject=subject,
            chunks=chunks
        )
    except Exception as e:
        print(f"[RAG Upload] Parsing error: {e}")
        chunks = []
        total_pages = 1

    now_str = datetime.utcnow().isoformat()
    doc_record = {
        "_id": doc_id,
        "user_id": current_user["_id"],
        "filename": filename,
        "file_size_bytes": file_size,
        "file_type": ext.replace(".", "").upper(),
        "total_pages": total_pages,
        "chunk_count": len(chunks),
        "subject": subject,
        "file_path": saved_path,
        "upload_timestamp": now_str,
        "status": "ready"
    }
    await docs_col.insert_one(doc_record)

    return DocumentMeta(
        id=doc_id,
        user_id=current_user["_id"],
        filename=filename,
        file_size_bytes=file_size,
        file_type=ext.replace(".", "").upper(),
        total_pages=total_pages,
        chunk_count=len(chunks),
        subject=subject,
        upload_timestamp=now_str,
        status="ready"
    )

@router.get("", response_model=List[DocumentMeta])
async def list_documents(current_user: dict = Depends(get_current_user)):
    docs_col = get_collection("documents")
    cursor = docs_col.find({"user_id": current_user["_id"]}).sort("upload_timestamp", -1)
    docs = await cursor.to_list(length=50)
    
    # Auto-seed sample doc if none exists for instant demo testing
    if not docs:
        sample_id = "sample_doc_cn_unit3"
        sample_doc = {
            "_id": sample_id,
            "user_id": current_user["_id"],
            "filename": "Computer Networks Unit 3 - Subnetting & Routing Notes.pdf",
            "file_size_bytes": 248500,
            "file_type": "PDF",
            "total_pages": 14,
            "chunk_count": 28,
            "subject": "Computer Networks",
            "file_path": "./data/uploads/sample.pdf",
            "upload_timestamp": datetime.utcnow().isoformat(),
            "status": "ready"
        }
        await docs_col.insert_one(sample_doc)
        
        # Seed sample chunks to vector store
        rag_engine.ingest_document(
            document_id=sample_id,
            user_id=current_user["_id"],
            filename="Computer Networks Unit 3 - Subnetting & Routing Notes.pdf",
            subject="Computer Networks",
            chunks=[
                {
                    "chunk_id": "c1",
                    "page_number": 4,
                    "content": "Distance Vector Routing: Each node maintains a vector of shortest distance estimates to all destinations. Bellman-Ford equation Dx(y) = min_v { c(x,v) + Dv(y) }. RIP uses hop count metric with maximum 15 hops to prevent count-to-infinity."
                },
                {
                    "chunk_id": "c2",
                    "page_number": 7,
                    "content": "Subnetting Principles: Borrow host bits to create subnets. For /26 mask (255.255.255.192), block size is 256-192=64. Subnet intervals are .0, .64, .128, .192. Each subnet has 62 usable hosts (64 - 2 reserved addresses)."
                },
                {
                    "chunk_id": "c3",
                    "page_number": 11,
                    "content": "OSPF and Link-State Routing: Routers broadcast Link-State Advertisements (LSAs) across areas. Every router constructs a synchronized topology map and executes Dijkstra's Shortest Path First algorithm."
                }
            ]
        )
        docs = [sample_doc]

    return [
        DocumentMeta(
            id=d["_id"],
            user_id=d["user_id"],
            filename=d["filename"],
            file_size_bytes=d.get("file_size_bytes", 0),
            file_type=d.get("file_type", "PDF"),
            total_pages=d.get("total_pages", 1),
            chunk_count=d.get("chunk_count", 0),
            subject=d.get("subject", "Computer Networks"),
            upload_timestamp=d.get("upload_timestamp", datetime.utcnow().isoformat()),
            status=d.get("status", "ready")
        )
        for d in docs
    ]

@router.post("/query", response_model=DocumentQueryResponse)
async def query_documents(
    req: DocumentQueryRequest,
    current_user: dict = Depends(get_current_user)
):
    chunks = rag_engine.search_similar_chunks(
        query=req.query,
        user_id=current_user["_id"],
        document_id=req.document_id,
        subject=req.subject,
        top_k=req.top_k
    )
    
    sources = [
        DocumentChunkReference(
            document_name=c["document_name"],
            page_number=c["page_number"],
            snippet=c["snippet"],
            score=c["score"]
        )
        for c in chunks
    ]
    
    if chunks:
        context_text = "\n".join([f"[{c['document_name']} Page {c['page_number']}]: {c['snippet']}" for c in chunks])
        sys_prompt = f"You are the SYNTRA Knowledge / RAG Agent. Answer the student's question based strictly on the retrieved study notes below. Clearly cite the document and page.\n\nContext:\n{context_text}"
        usr_prompt = req.query
        answer = await llm_client.generate_response(sys_prompt, usr_prompt)
        used_rag = True
    else:
        answer = "No relevant context was found in your uploaded study notes for this query. The response is based on standard academic curriculum principles."
        used_rag = False

    return DocumentQueryResponse(
        query=req.query,
        answer=answer,
        sources=sources,
        used_rag=used_rag
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    docs_col = get_collection("documents")
    doc = await docs_col.find_one({"_id": document_id, "user_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    # Delete from ChromaDB
    rag_engine.delete_document(document_id)
    
    # Delete file from disk
    if "file_path" in doc and os.path.exists(doc["file_path"]):
        try:
            os.remove(doc["file_path"])
        except Exception:
            pass
            
    await docs_col.delete_one({"_id": document_id})
    return {"message": "Document successfully removed.", "document_id": document_id}
