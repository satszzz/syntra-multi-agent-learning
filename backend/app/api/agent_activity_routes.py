from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.auth.security import get_current_user
from app.database.db import get_collection

router = APIRouter(prefix="/agent-activity", tags=["Agent Activity & Transparency"])

@router.get("")
async def get_agent_activity(current_user: dict = Depends(get_current_user)):
    activity_col = get_collection("agent_sessions")
    cursor = activity_col.find({"user_id": current_user["_id"]}).sort("timestamp", -1)
    sessions = await cursor.to_list(length=20)
    
    # If empty, provide rich demo agent timeline
    if not sessions:
        now_str = datetime.utcnow().isoformat()
        sample_sessions = [
            {
                "_id": "session_sample_1",
                "user_id": current_user["_id"],
                "action_type": "goal_plan_orchestration",
                "supervisor_decision": "Analyzed 7-day Computer Networks exam goal. Routed to RAG Agent -> Planning Agent -> Evaluation Agent.",
                "agent_steps": [
                    {
                        "agent_name": "Supervisor / Orchestrator Agent",
                        "action": "Deconstructed student requirement: 7-day timeline with weaknesses in Subnetting and Routing.",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Knowledge / RAG Agent",
                        "action": "Retrieved 4 relevant sections from 'Computer Networks Unit 3 Notes.pdf' (CIDR, Subnetting, RIP).",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Planning Agent",
                        "action": "Generated 7-day study roadmap prioritizing FLSM, VLSM, and dynamic routing protocols.",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Evaluation Agent",
                        "action": "Prepared diagnostic quiz to verify baseline subnetting comprehension.",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Supervisor / Orchestrator Agent",
                        "action": "Synthesized roadmap, verified milestone balance, and activated personalized dashboard.",
                        "status": "completed",
                        "timestamp": now_str
                    }
                ],
                "timestamp": now_str
            },
            {
                "_id": "session_sample_2",
                "user_id": current_user["_id"],
                "action_type": "adaptive_rebalance",
                "supervisor_decision": "Evaluation Agent detected 50% accuracy on Subnetting. Triggered Planning Agent for adaptive mutation.",
                "agent_steps": [
                    {
                        "agent_name": "Evaluation Agent",
                        "action": "Graded 5 questions. Categorized 'OSI Model' as Strong and 'Subnetting' as Weak.",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Supervisor / Orchestrator Agent",
                        "action": "Evaluated weak threshold breach. Dispatched Planning Agent to inject remedial drills.",
                        "status": "completed",
                        "timestamp": now_str
                    },
                    {
                        "agent_name": "Planning Agent",
                        "action": "Adapted Day 3 & Day 4: Added Intensive Subnetting Problem Workshop.",
                        "status": "completed",
                        "timestamp": now_str
                    }
                ],
                "timestamp": now_str
            }
        ]
        return sample_sessions

    return [
        {
            "id": s.get("_id"),
            "action_type": s.get("action_type", "agent_action"),
            "supervisor_decision": s.get("supervisor_decision", "Multi-agent coordination"),
            "agent_steps": s.get("agent_steps", []),
            "timestamp": s.get("timestamp", datetime.utcnow().isoformat())
        }
        for s in sessions
    ]
