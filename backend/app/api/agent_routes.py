import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import LearnTopicRequest, LearnTopicResponse, AgentRunRequest, AgentRunResponse, AgentStepLog
from app.auth.security import get_current_user
from app.database.db import get_collection
from app.agents.supervisor import supervisor_agent
from app.agents.learning_agent import learning_agent
from app.agents.rag_agent import rag_agent
from app.agents.state import AgentState

router = APIRouter(prefix="/agents", tags=["AI Agents"])

@router.post("/learn", response_model=LearnTopicResponse)
async def learn_topic(
    req: LearnTopicRequest,
    current_user: dict = Depends(get_current_user)
):
    activity_col = get_collection("agent_sessions")
    
    # 1. First RAG retrieval for any uploaded notes
    temp_state: AgentState = {
        "user_id": current_user["_id"],
        "subject": req.subject,
        "current_topic": req.topic,
        "user_message": f"Explain {req.topic} in {req.subject}",
        "agent_logs": []
    }
    rag_state = await rag_agent.execute(temp_state)
    retrieved = rag_state.get("retrieved_context", [])
    
    # 2. Learning Agent explains concept
    explanation_data = await learning_agent.explain_concept(
        topic=req.topic,
        subject=req.subject,
        student_level=req.current_level or "Intermediate",
        retrieved_context=retrieved,
        action=req.action or "explain"
    )
    
    # Save agent session
    await activity_col.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "action_type": f"learn_{req.action}_{req.topic}",
        "supervisor_decision": f"Supervisor routed: RAG Agent (retrieved {len(retrieved)} sources) -> Learning Agent (custom explanation).",
        "agent_steps": rag_state.get("agent_logs", []),
        "timestamp": datetime.utcnow().isoformat()
    })

    return LearnTopicResponse(
        topic=explanation_data.get("topic", req.topic),
        explanation=explanation_data.get("explanation", ""),
        key_points=explanation_data.get("key_points", []),
        real_world_example=explanation_data.get("real_world_example", ""),
        practice_question=explanation_data.get("practice_question"),
        suggested_next_topics=explanation_data.get("suggested_next_topics", []),
        citations=explanation_data.get("citations", []),
        mind_map=explanation_data.get("mind_map")
    )

@router.post("/run", response_model=AgentRunResponse)
async def run_agents(
    req: AgentRunRequest,
    current_user: dict = Depends(get_current_user)
):
    activity_col = get_collection("agent_sessions")
    
    initial_state: AgentState = {
        "user_id": current_user["_id"],
        "goal_id": req.goal_id,
        "user_message": req.message,
        "action_type": req.action_type or "general",
        "agent_logs": []
    }
    
    final_state = await supervisor_agent.run(initial_state)
    session_id = str(uuid.uuid4())
    
    raw_logs = final_state.get("agent_logs", [])
    step_logs = [
        AgentStepLog(
            agent_name=l["agent_name"],
            action=l["action"],
            status=l["status"],
            details=l.get("details"),
            timestamp=l["timestamp"]
        )
        for l in raw_logs
    ]
    
    # Save session
    await activity_col.insert_one({
        "_id": session_id,
        "user_id": current_user["_id"],
        "goal_id": req.goal_id,
        "action_type": req.action_type,
        "supervisor_decision": final_state.get("supervisor_decision", "Multi-agent coordination completed."),
        "agent_steps": raw_logs,
        "timestamp": datetime.utcnow().isoformat()
    })

    return AgentRunResponse(
        session_id=session_id,
        supervisor_decision=final_state.get("supervisor_decision", "Orchestrated specialized agents."),
        response_text=final_state.get("final_response", "Workflow execution finished."),
        agent_steps=step_logs,
        data={
            "retrieved_count": len(final_state.get("retrieved_context", [])),
            "study_plan": final_state.get("study_plan")
        }
    )
