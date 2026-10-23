import os
import re
import math
from typing import List, Dict, Any, Optional
import pymupdf
from app.config.settings import settings

class RAGEngine:
    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)
        self.chroma_client = None
        self.collection = None
        self._init_vector_store()

    def _init_vector_store(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            self.chroma_client = chromadb.PersistentClient(path=self.persist_dir)
            self.collection = self.chroma_client.get_or_create_collection(
                name="syntra_study_materials",
                metadata={"hnsw:space": "cosine"}
            )
            print("[RAG] ChromaDB vector store initialized.")
        except Exception as e:
            print(f"[RAG] Warning: ChromaDB initialization error ({e}). Using in-memory fallback index.")
            self.chroma_client = None
            self._fallback_store: List[Dict[str, Any]] = []

    def extract_text_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract text page by page from PDF using PyMuPDF."""
        pages_content = []
        try:
            doc = pymupdf.open(file_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                # Clean whitespace
                cleaned_text = re.sub(r'\s+', ' ', text).strip()
                if cleaned_text:
                    pages_content.append({
                        "page_number": page_num + 1,
                        "text": cleaned_text
                    })
            doc.close()
        except Exception as e:
            print(f"[RAG] PyMuPDF extraction error: {e}")
            raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")
        return pages_content

    def extract_text_from_txt(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract text from plain text file."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            cleaned = re.sub(r'\s+', ' ', content).strip()
            return [{"page_number": 1, "text": cleaned}]
        except Exception as e:
            raise RuntimeError(f"Failed to read text file: {str(e)}")

    def chunk_text(
        self,
        pages_content: List[Dict[str, Any]],
        chunk_size: int = 500,
        chunk_overlap: int = 100
    ) -> List[Dict[str, Any]]:
        """Split text into semantic overlapping chunks with page metadata."""
        chunks = []
        chunk_id = 0

        for page_data in pages_content:
            text = page_data["text"]
            page_num = page_data["page_number"]
            
            # Simple token/character sliding window with overlap
            words = text.split(" ")
            # Approximate 1 token = 0.75 words, chunk_size in words ~ 380 words
            target_words_per_chunk = max(30, int(chunk_size * 0.75))
            overlap_words = max(10, int(chunk_overlap * 0.75))
            
            start = 0
            while start < len(words):
                end = min(start + target_words_per_chunk, len(words))
                chunk_words = words[start:end]
                chunk_str = " ".join(chunk_words)
                
                if len(chunk_str.strip()) > 30: # Avoid tiny fragments
                    chunks.append({
                        "chunk_id": f"chunk_{chunk_id}",
                        "page_number": page_num,
                        "content": chunk_str
                    })
                    chunk_id += 1
                
                if end == len(words):
                    break
                start += (target_words_per_chunk - overlap_words)

        return chunks

    def _compute_simple_embedding(self, text: str, dim: int = 64) -> List[float]:
        """Deterministic lightweight vector representation for fallback semantic search."""
        words = re.findall(r'\w+', text.lower())
        vec = [0.0] * dim
        for w in words:
            h = hash(w)
            idx = abs(h) % dim
            vec[idx] += 1.0
        # Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def ingest_document(
        self,
        document_id: str,
        user_id: str,
        filename: str,
        subject: str,
        chunks: List[Dict[str, Any]]
    ):
        """Add document chunks to vector database with metadata."""
        if not chunks:
            return

        ids = [f"{document_id}_{c['chunk_id']}" for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "document_name": filename,
                "subject": subject or "General",
                "page_number": c["page_number"]
            }
            for c in chunks
        ]

        if self.collection is not None:
            try:
                # Add embeddings / documents to ChromaDB
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                print(f"[RAG] Ingested {len(chunks)} chunks into ChromaDB for doc: {filename}")
                return
            except Exception as e:
                print(f"[RAG] Error adding to ChromaDB: {e}. Storing in fallback.")

        # In-memory fallback
        if not hasattr(self, "_fallback_store"):
            self._fallback_store = []
        for i, doc_str in enumerate(documents):
            self._fallback_store.append({
                "id": ids[i],
                "content": doc_str,
                "metadata": metadatas[i],
                "vector": self._compute_simple_embedding(doc_str)
            })

    def search_similar_chunks(
        self,
        query: str,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        subject: Optional[str] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Retrieve top-K most relevant chunks using vector similarity."""
        results = []
        
        # Build ChromaDB where filter
        where_filters = {}
        if user_id:
            where_filters["user_id"] = user_id
        if document_id:
            where_filters["document_id"] = document_id
        
        if self.collection is not None:
            try:
                chroma_res = self.collection.query(
                    query_texts=[query],
                    n_results=top_k,
                    where=where_filters if where_filters else None
                )
                
                if chroma_res and chroma_res["documents"] and len(chroma_res["documents"][0]) > 0:
                    docs = chroma_res["documents"][0]
                    metas = chroma_res["metadatas"][0]
                    distances = chroma_res["distances"][0] if "distances" in chroma_res and chroma_res["distances"] else [0.0]*len(docs)
                    
                    for i in range(len(docs)):
                        meta = metas[i] if i < len(metas) else {}
                        score = round(1.0 - (distances[i] if i < len(distances) else 0.0), 3)
                        results.append({
                            "document_name": meta.get("document_name", "Unknown Document"),
                            "page_number": meta.get("page_number", 1),
                            "snippet": docs[i],
                            "score": max(0.1, score)
                        })
                    return results
            except Exception as e:
                print(f"[RAG] Chroma query fallback trigger: {e}")

        # Fallback keyword + simple vector cosine similarity
        if hasattr(self, "_fallback_store") and self._fallback_store:
            query_vec = self._compute_simple_embedding(query)
            q_words = set(re.findall(r'\w+', query.lower()))
            scored = []
            
            for item in self._fallback_store:
                if user_id and item["metadata"].get("user_id") != user_id:
                    continue
                if document_id and item["metadata"].get("document_id") != document_id:
                    continue
                
                # Cosine similarity
                dot_prod = sum(a * b for a, b in zip(query_vec, item["vector"]))
                # Keyword overlap boost
                doc_words = set(re.findall(r'\w+', item["content"].lower()))
                overlap = len(q_words.intersection(doc_words)) / max(1, len(q_words))
                total_score = (dot_prod * 0.6) + (overlap * 0.4)
                
                scored.append((total_score, item))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            for sc, itm in scored[:top_k]:
                results.append({
                    "document_name": itm["metadata"].get("document_name", "Document"),
                    "page_number": itm["metadata"].get("page_number", 1),
                    "snippet": itm["content"],
                    "score": round(sc, 3)
                })

        return results

    def delete_document(self, document_id: str):
        """Remove document chunks from ChromaDB and fallback store."""
        if self.collection is not None:
            try:
                self.collection.delete(where={"document_id": document_id})
            except Exception as e:
                print(f"[RAG] Chroma delete error: {e}")

        if hasattr(self, "_fallback_store"):
            self._fallback_store = [
                item for item in self._fallback_store
                if item["metadata"].get("document_id") != document_id
            ]

rag_engine = RAGEngine()
