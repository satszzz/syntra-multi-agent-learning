from datetime import datetime
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.rag.rag_engine import rag_engine

class RAGAgent:
    """Specialized Knowledge Agent for semantic retrieval from student notes and lecture PDFs."""
    def __init__(self):
        self.name = "Knowledge / RAG Agent"

    async def execute(self, state: AgentState) -> AgentState:
        query = state.get("user_message", "") or state.get("current_topic", "") or state.get("subject", "")
        user_id = state.get("user_id")
        subject = state.get("subject")
        
        # Log start
        logs = list(state.get("agent_logs", []))
        logs.append({
            "agent_name": self.name,
            "action": f"Searching vector index for semantic context matching: '{query[:50]}...'",
            "status": "starting",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Retrieve chunks
        chunks = rag_engine.search_similar_chunks(
            query=query,
            user_id=user_id,
            subject=subject,
            top_k=4
        )
        
        if chunks:
            doc_names = list(set([c["document_name"] for c in chunks]))
            logs.append({
                "agent_name": self.name,
                "action": f"Retrieved {len(chunks)} relevant sections from: {', '.join(doc_names)}",
                "status": "completed",
                "details": f"Top similarity score: {chunks[0]['score']}",
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            logs.append({
                "agent_name": self.name,
                "action": "No specific student documents uploaded; using foundational academic curriculum knowledge.",
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat()
            })
            
        state["retrieved_context"] = chunks
        state["agent_logs"] = logs
        return state

rag_agent = RAGAgent()
