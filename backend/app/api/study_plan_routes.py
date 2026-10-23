import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import StudyPlan
from app.auth.security import get_current_user
from app.database.db import get_collection
from app.agents.supervisor import supervisor_agent
from app.agents.state import AgentState

router = APIRouter(prefix="/study-plan", tags=["Study Plan"])

@router.get("", response_model=StudyPlan)
async def get_study_plan(current_user: dict = Depends(get_current_user)):
    plans_col = get_collection("study_plans")
    goals_col = get_collection("learning_goals")
    profiles_col = get_collection("student_profiles")
    
    # Try finding by active goal
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    goal_id = profile.get("current_goal_id") if profile else None
    
    plan = None
    if goal_id:
        plan = await plans_col.find_one({"goal_id": goal_id})
        
    if not plan:
        cursor = plans_col.find({"user_id": current_user["_id"]}).sort("updated_at", -1)
        plans = await cursor.to_list(length=1)
        if plans:
            plan = plans[0]
            
    if not plan:
        # Generate initial plan automatically
        initial_state: AgentState = {
            "user_id": current_user["_id"],
            "subject": "Computer Networks",
            "goal_description": "Exam preparation in 7 days",
            "days_remaining": 7,
            "student_level": "Intermediate",
            "weak_topics": ["Subnetting", "Routing"],
            "daily_study_hours": 2.0,
            "action_type": "goal_plan"
        }
        final_state = await supervisor_agent.run(initial_state)
        plan = final_state.get("study_plan")
        if plan:
            plan["_id"] = plan.get("id", str(uuid.uuid4()))
            plan["user_id"] = current_user["_id"]
            await plans_col.insert_one(plan)

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found. Please create a learning goal first."
        )

    return StudyPlan(
        id=plan["_id"],
        user_id=plan["user_id"],
        goal_id=plan.get("goal_id", "goal_1"),
        subject=plan.get("subject", "Computer Networks"),
        total_days=int(plan.get("total_days", 7)),
        version=int(plan.get("version", 1)),
        schedule=plan.get("schedule", []),
        is_adapted=bool(plan.get("is_adapted", False)),
        adaptation_reason=plan.get("adaptation_reason"),
        created_at=plan.get("created_at", datetime.utcnow().isoformat()),
        updated_at=plan.get("updated_at", datetime.utcnow().isoformat())
    )

@router.put("/topics/{topic_id}/status")
async def toggle_topic_status(
    topic_id: str,
    current_user: dict = Depends(get_current_user)
):
    plans_col = get_collection("study_plans")
    profiles_col = get_collection("student_profiles")
    
    cursor = plans_col.find({"user_id": current_user["_id"]}).sort("updated_at", -1)
    plans = await cursor.to_list(length=1)
    if not plans:
        raise HTTPException(status_code=404, detail="No active study plan.")
        
    plan = plans[0]
    schedule = plan.get("schedule", [])
    
    found = False
    new_status = False
    total_topics = 0
    completed_topics_count = 0
    completed_topic_names = []
    
    for day in schedule:
        day_all_completed = True
        for topic in day.get("topics", []):
            total_topics += 1
            if topic.get("topic_id") == topic_id:
                topic["is_completed"] = not topic.get("is_completed", False)
                new_status = topic["is_completed"]
                found = True
            
            if topic.get("is_completed"):
                completed_topics_count += 1
                completed_topic_names.append(topic.get("name"))
            else:
                day_all_completed = False
        day["is_completed"] = day_all_completed

    if not found:
        raise HTTPException(status_code=404, detail="Topic ID not found in current study plan.")

    # Calculate overall progress
    progress = round((completed_topics_count / max(1, total_topics)) * 100, 1)
    
    await plans_col.update_one(
        {"_id": plan["_id"]},
        {"$set": {
            "schedule": schedule,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    # Update student profile progress
    await profiles_col.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {
            "overall_progress": progress,
            "completed_topics": completed_topic_names,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )

    return {
        "topic_id": topic_id,
        "is_completed": new_status,
        "overall_progress": progress,
        "completed_count": completed_topics_count,
        "total_count": total_topics
    }

@router.post("/adapt", response_model=StudyPlan)
async def trigger_plan_adaptation(current_user: dict = Depends(get_current_user)):
    """Explicitly trigger multi-agent adaptive rebalancing."""
    plans_col = get_collection("study_plans")
    profiles_col = get_collection("student_profiles")
    activity_col = get_collection("agent_sessions")
    
    cursor = plans_col.find({"user_id": current_user["_id"]}).sort("updated_at", -1)
    plans = await cursor.to_list(length=1)
    existing_plan = plans[0] if plans else None
    
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    weak_topics = profile.get("weak_topics", ["Subnetting", "Routing"]) if profile else ["Subnetting", "Routing"]
    
    state: AgentState = {
        "user_id": current_user["_id"],
        "subject": existing_plan.get("subject", "Computer Networks") if existing_plan else "Computer Networks",
        "study_plan": existing_plan,
        "weak_topics": weak_topics,
        "action_type": "adapt_plan",
        "user_message": "Adaptive study plan rebalance request.",
        "agent_logs": []
    }
    
    final_state = await supervisor_agent.run(state)
    adapted_plan = final_state.get("study_plan")
    
    if adapted_plan:
        plan_id = existing_plan["_id"] if existing_plan else str(uuid.uuid4())
        adapted_plan["_id"] = plan_id
        adapted_plan["user_id"] = current_user["_id"]
        
        await plans_col.update_one(
            {"_id": plan_id},
            {"$set": adapted_plan},
            upsert=True
        )
        
        # Log session
        await activity_col.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "action_type": "adapt_plan",
            "supervisor_decision": final_state.get("supervisor_decision", ""),
            "agent_steps": final_state.get("agent_logs", []),
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return StudyPlan(
            id=plan_id,
            user_id=current_user["_id"],
            goal_id=adapted_plan.get("goal_id", "goal_1"),
            subject=adapted_plan.get("subject", "Computer Networks"),
            total_days=int(adapted_plan.get("total_days", 7)),
            version=int(adapted_plan.get("version", 1)),
            schedule=adapted_plan.get("schedule", []),
            is_adapted=True,
            adaptation_reason=adapted_plan.get("adaptation_reason"),
            created_at=adapted_plan.get("created_at", datetime.utcnow().isoformat()),
            updated_at=datetime.utcnow().isoformat()
        )
    
    raise HTTPException(status_code=500, detail="Failed to adapt plan.")
