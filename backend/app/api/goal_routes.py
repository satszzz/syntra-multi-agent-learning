import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import LearningGoalCreate, LearningGoalResponse, StudyPlan
from app.auth.security import get_current_user
from app.database.db import get_collection
from app.agents.supervisor import supervisor_agent
from app.agents.state import AgentState

router = APIRouter(prefix="/goals", tags=["Learning Goals"])

@router.post("", response_model=LearningGoalResponse)
async def create_learning_goal(
    goal_in: LearningGoalCreate,
    current_user: dict = Depends(get_current_user)
):
    goals_col = get_collection("learning_goals")
    plans_col = get_collection("study_plans")
    profiles_col = get_collection("student_profiles")
    activity_col = get_collection("agent_sessions")
    
    # Calculate days remaining
    try:
        exam_dt = datetime.strptime(goal_in.exam_date, "%Y-%m-%d")
        now_dt = datetime.utcnow()
        days_rem = max(1, (exam_dt - now_dt).days + 1)
    except Exception:
        days_rem = 7

    goal_id = str(uuid.uuid4())
    user_id = current_user["_id"]
    
    # Prepare shared agent state
    initial_state: AgentState = {
        "user_id": user_id,
        "goal_id": goal_id,
        "subject": goal_in.subject,
        "goal_description": goal_in.goal_description,
        "exam_date": goal_in.exam_date,
        "days_remaining": days_rem,
        "student_level": goal_in.student_level,
        "weak_topics": goal_in.weak_topics,
        "strong_topics": ["OSI Model", "TCP/IP"],
        "daily_study_hours": goal_in.daily_study_hours,
        "user_message": f"I have a {goal_in.subject} exam on {goal_in.exam_date}. {goal_in.goal_description}. Weak in: {', '.join(goal_in.weak_topics)}",
        "action_type": "goal_plan",
        "agent_logs": []
    }
    
    # Run multi-agent orchestration
    final_state = await supervisor_agent.run(initial_state)
    
    # Store generated study plan
    study_plan_data = final_state.get("study_plan")
    study_plan_id = study_plan_data.get("id", str(uuid.uuid4())) if study_plan_data else None
    
    if study_plan_data:
        study_plan_data["_id"] = study_plan_id
        study_plan_data["goal_id"] = goal_id
        study_plan_data["user_id"] = user_id
        await plans_col.insert_one(study_plan_data)
        
    # Store agent activity session
    session_id = str(uuid.uuid4())
    await activity_col.insert_one({
        "_id": session_id,
        "user_id": user_id,
        "goal_id": goal_id,
        "action_type": "goal_plan",
        "supervisor_decision": final_state.get("supervisor_decision", ""),
        "agent_steps": final_state.get("agent_logs", []),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    now_str = datetime.utcnow().isoformat()
    goal_doc = {
        "_id": goal_id,
        "user_id": user_id,
        "subject": goal_in.subject,
        "goal_description": goal_in.goal_description,
        "exam_date": goal_in.exam_date,
        "student_level": goal_in.student_level,
        "weak_topics": goal_in.weak_topics,
        "daily_study_hours": goal_in.daily_study_hours,
        "days_remaining": days_rem,
        "status": "active",
        "study_plan_id": study_plan_id,
        "created_at": now_str
    }
    await goals_col.insert_one(goal_doc)
    
    # Update profile active goal
    await profiles_col.update_one(
        {"user_id": user_id},
        {"$set": {
            "current_goal_id": goal_id,
            "weak_topics": goal_in.weak_topics,
            "updated_at": now_str
        }},
        upsert=True
    )
    
    return LearningGoalResponse(
        id=goal_id,
        user_id=user_id,
        subject=goal_in.subject,
        goal_description=goal_in.goal_description,
        exam_date=goal_in.exam_date,
        student_level=goal_in.student_level,
        weak_topics=goal_in.weak_topics,
        daily_study_hours=goal_in.daily_study_hours,
        days_remaining=days_rem,
        status="active",
        created_at=now_str,
        study_plan_id=study_plan_id
    )

@router.get("", response_model=List[LearningGoalResponse])
async def list_goals(current_user: dict = Depends(get_current_user)):
    goals_col = get_collection("learning_goals")
    cursor = goals_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    goals = await cursor.to_list(length=20)
    
    return [
        LearningGoalResponse(
            id=g["_id"],
            user_id=g["user_id"],
            subject=g["subject"],
            goal_description=g["goal_description"],
            exam_date=g["exam_date"],
            student_level=g.get("student_level", "Intermediate"),
            weak_topics=g.get("weak_topics", []),
            daily_study_hours=float(g.get("daily_study_hours", 2.0)),
            days_remaining=int(g.get("days_remaining", 7)),
            status=g.get("status", "active"),
            created_at=g.get("created_at", datetime.utcnow().isoformat()),
            study_plan_id=g.get("study_plan_id")
        )
        for g in goals
    ]

@router.get("/active", response_model=LearningGoalResponse)
async def get_active_goal(current_user: dict = Depends(get_current_user)):
    goals_col = get_collection("learning_goals")
    profiles_col = get_collection("student_profiles")
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    
    goal = None
    if profile and profile.get("current_goal_id"):
        goal = await goals_col.find_one({"_id": profile["current_goal_id"]})
        
    if not goal:
        cursor = goals_col.find({"user_id": current_user["_id"]}).sort("created_at", -1)
        goals = await cursor.to_list(length=1)
        if goals:
            goal = goals[0]
            
    if not goal:
        # Create a default active goal for smooth initial experience
        now_dt = datetime.utcnow()
        exam_dt = now_dt.strftime("%Y-%m-%d")
        default_goal = {
            "_id": "goal_demo_cn",
            "user_id": current_user["_id"],
            "subject": "Computer Networks",
            "goal_description": "Prepare for semester exam in 7 days. Weak in Subnetting & Routing.",
            "exam_date": "2026-09-23",
            "student_level": "Intermediate",
            "weak_topics": ["Subnetting", "Routing"],
            "daily_study_hours": 2.0,
            "days_remaining": 7,
            "status": "active",
            "study_plan_id": None,
            "created_at": now_dt.isoformat()
        }
        await goals_col.insert_one(default_goal)
        goal = default_goal

    return LearningGoalResponse(
        id=goal["_id"],
        user_id=goal["user_id"],
        subject=goal["subject"],
        goal_description=goal["goal_description"],
        exam_date=goal["exam_date"],
        student_level=goal.get("student_level", "Intermediate"),
        weak_topics=goal.get("weak_topics", []),
        daily_study_hours=float(goal.get("daily_study_hours", 2.0)),
        days_remaining=int(goal.get("days_remaining", 7)),
        status=goal.get("status", "active"),
        created_at=goal.get("created_at", datetime.utcnow().isoformat()),
        study_plan_id=goal.get("study_plan_id")
    )
