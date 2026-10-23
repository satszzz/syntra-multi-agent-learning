from typing import Any, Dict, List, Optional, TypedDict

class AgentState(TypedDict, total=False):
    # Student & Goal Context
    user_id: str
    goal_id: Optional[str]
    subject: str
    goal_description: str
    exam_date: str
    days_remaining: int
    student_level: str
    weak_topics: List[str]
    strong_topics: List[str]
    daily_study_hours: float
    
    # Request & Dispatch
    user_message: str
    action_type: str # 'goal_plan' | 'learn_topic' | 'rag_qa' | 'adapt_plan' | 'evaluate' | 'general'
    current_topic: Optional[str]
    
    # Context & Artifacts
    retrieved_context: List[Dict[str, Any]]
    study_plan: Optional[Dict[str, Any]]
    quiz: Optional[Dict[str, Any]]
    quiz_result: Optional[Dict[str, Any]]
    
    # Orchestration & Activity Transparency
    supervisor_decision: str
    agent_logs: List[Dict[str, Any]]
    final_response: str
    next_agent: str
    is_completed: bool
