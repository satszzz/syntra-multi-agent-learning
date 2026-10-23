import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas import Quiz, QuizSubmitRequest, QuizResultResponse
from app.auth.security import get_current_user
from app.database.db import get_collection
from app.agents.evaluation_agent import evaluation_agent
from app.agents.supervisor import supervisor_agent
from app.agents.state import AgentState

router = APIRouter(prefix="/quiz", tags=["Quiz & Evaluation"])

@router.post("/generate", response_model=Quiz)
async def generate_quiz(
    subject: Optional[str] = Query("Computer Networks"),
    topic: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    quizzes_col = get_collection("quizzes")
    profiles_col = get_collection("student_profiles")
    
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    weak_topics = profile.get("weak_topics", ["Subnetting", "Routing"]) if profile else ["Subnetting", "Routing"]
    
    quiz_data = await evaluation_agent.generate_quiz(
        subject=subject,
        weak_topics=weak_topics,
        num_questions=5,
        target_topic=topic
    )
    
    quiz_doc = dict(quiz_data)
    quiz_doc["_id"] = quiz_data["id"]
    quiz_doc["user_id"] = current_user["_id"]
    await quizzes_col.insert_one(quiz_doc)
    
    return Quiz(
        id=quiz_data["id"],
        subject=quiz_data["subject"],
        title=quiz_data["title"],
        questions=quiz_data["questions"],
        created_at=quiz_data["created_at"]
    )

@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    submit_in: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    quizzes_col = get_collection("quizzes")
    results_col = get_collection("quiz_results")
    profiles_col = get_collection("student_profiles")
    plans_col = get_collection("study_plans")
    activity_col = get_collection("agent_sessions")
    
    quiz = await quizzes_col.find_one({"_id": submit_in.quiz_id})
    if not quiz:
        # Fallback generated quiz object
        quiz = await evaluation_agent.generate_quiz(subject="Computer Networks")
        quiz["_id"] = submit_in.quiz_id

    # 1. Evaluation Agent grades quiz
    answers_dicts = [a.dict() for a in submit_in.answers]
    grade_result = await evaluation_agent.grade_quiz(
        quiz=quiz,
        user_answers=answers_dicts,
        user_id=current_user["_id"]
    )
    
    result_id = grade_result["id"]
    grade_result["_id"] = result_id
    await results_col.insert_one(grade_result)
    
    # 2. Update Student Profile Stats
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    prev_taken = profile.get("quizzes_taken", 0) if profile else 0
    prev_avg = profile.get("average_quiz_score", 0.0) if profile else 0.0
    
    new_taken = prev_taken + 1
    new_avg = round(((prev_avg * prev_taken) + grade_result["score_percentage"]) / new_taken, 1)
    
    updated_weak = list(set((profile.get("weak_topics", []) if profile else []) + grade_result["identified_weak_topics"]))
    updated_strong = list(set((profile.get("strong_topics", []) if profile else []) + grade_result["identified_strong_topics"]))
    # Remove strong topics from weak list
    updated_weak = [w for w in updated_weak if w not in grade_result["identified_strong_topics"]]

    await profiles_col.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {
            "quizzes_taken": new_taken,
            "average_quiz_score": new_avg,
            "weak_topics": updated_weak,
            "strong_topics": updated_strong,
            "total_study_minutes": (profile.get("total_study_minutes", 0) if profile else 0) + 20,
            "updated_at": datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    
    # 3. TRIGGER ADAPTIVE LEARNING LOOP IF WEAK TOPICS IDENTIFIED
    adapted = False
    if grade_result["identified_weak_topics"]:
        cursor = plans_col.find({"user_id": current_user["_id"]}).sort("updated_at", -1)
        plans = await cursor.to_list(length=1)
        existing_plan = plans[0] if plans else None
        
        state: AgentState = {
            "user_id": current_user["_id"],
            "subject": quiz.get("subject", "Computer Networks"),
            "study_plan": existing_plan,
            "quiz_result": grade_result,
            "weak_topics": updated_weak,
            "action_type": "adapt_plan",
            "agent_logs": []
        }
        
        final_state = await supervisor_agent.run(state)
        adapted_plan = final_state.get("study_plan")
        
        if adapted_plan:
            plan_id = existing_plan["_id"] if existing_plan else str(uuid.uuid4())
            adapted_plan["_id"] = plan_id
            adapted_plan["user_id"] = current_user["_id"]
            await plans_col.update_one({"_id": plan_id}, {"$set": adapted_plan}, upsert=True)
            adapted = True
            
            # Save Agent activity
            await activity_col.insert_one({
                "_id": str(uuid.uuid4()),
                "user_id": current_user["_id"],
                "action_type": "quiz_evaluation_and_adaptive_rebalance",
                "supervisor_decision": "Evaluation Agent flagged weak areas -> Triggered Planning Agent to mutate study plan.",
                "agent_steps": final_state.get("agent_logs", []),
                "timestamp": datetime.utcnow().isoformat()
            })

    grade_result["study_plan_adapted"] = adapted
    
    return QuizResultResponse(
        id=result_id,
        quiz_id=grade_result["quiz_id"],
        user_id=current_user["_id"],
        subject=grade_result["subject"],
        total_questions=grade_result["total_questions"],
        correct_count=grade_result["correct_count"],
        score_percentage=grade_result["score_percentage"],
        topic_breakdown=grade_result["topic_breakdown"],
        identified_weak_topics=grade_result["identified_weak_topics"],
        identified_strong_topics=grade_result["identified_strong_topics"],
        ai_feedback=grade_result["ai_feedback"],
        study_plan_adapted=adapted,
        submitted_at=grade_result["submitted_at"]
    )

@router.get("/history", response_model=List[QuizResultResponse])
async def get_quiz_history(current_user: dict = Depends(get_current_user)):
    results_col = get_collection("quiz_results")
    cursor = results_col.find({"user_id": current_user["_id"]}).sort("submitted_at", -1)
    results = await cursor.to_list(length=30)
    
    return [
        QuizResultResponse(
            id=r["_id"],
            quiz_id=r["quiz_id"],
            user_id=r["user_id"],
            subject=r.get("subject", "Computer Networks"),
            total_questions=r.get("total_questions", 5),
            correct_count=r.get("correct_count", 0),
            score_percentage=float(r.get("score_percentage", 0.0)),
            topic_breakdown=r.get("topic_breakdown", []),
            identified_weak_topics=r.get("identified_weak_topics", []),
            identified_strong_topics=r.get("identified_strong_topics", []),
            ai_feedback=r.get("ai_feedback", ""),
            study_plan_adapted=bool(r.get("study_plan_adapted", False)),
            submitted_at=r.get("submitted_at", datetime.utcnow().isoformat())
        )
        for r in results
    ]
