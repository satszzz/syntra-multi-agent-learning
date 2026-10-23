from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import StudentProfile, StudentProfileUpdate
from app.auth.security import get_current_user
from app.database.db import get_collection

router = APIRouter(prefix="/student", tags=["Student Profile"])

@router.get("/profile", response_model=StudentProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    profiles_col = get_collection("student_profiles")
    profile = await profiles_col.find_one({"user_id": current_user["_id"]})
    
    if not profile:
        # Auto-create if missing
        profile = {
            "_id": f"prof_{current_user['_id']}",
            "user_id": current_user["_id"],
            "name": current_user.get("name", "Student"),
            "current_goal_id": None,
            "strong_topics": ["OSI Model", "TCP/IP"],
            "weak_topics": ["Subnetting", "Routing"],
            "preferred_learning_style": current_user.get("preferred_learning_style", "Visual & Interactive"),
            "overall_progress": 0.0,
            "total_study_minutes": 0,
            "quizzes_taken": 0,
            "average_quiz_score": 0.0,
            "completed_topics": [],
            "updated_at": datetime.utcnow().isoformat()
        }
        await profiles_col.insert_one(profile)

    return StudentProfile(
        id=profile.get("_id"),
        user_id=profile["user_id"],
        name=profile.get("name", current_user.get("name", "")),
        current_goal_id=profile.get("current_goal_id"),
        strong_topics=profile.get("strong_topics", []),
        weak_topics=profile.get("weak_topics", []),
        preferred_learning_style=profile.get("preferred_learning_style", "Visual & Interactive"),
        overall_progress=float(profile.get("overall_progress", 0.0)),
        total_study_minutes=int(profile.get("total_study_minutes", 0)),
        quizzes_taken=int(profile.get("quizzes_taken", 0)),
        average_quiz_score=float(profile.get("average_quiz_score", 0.0)),
        completed_topics=profile.get("completed_topics", []),
        updated_at=profile.get("updated_at")
    )

@router.put("/profile", response_model=StudentProfile)
async def update_profile(
    profile_in: StudentProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    profiles_col = get_collection("student_profiles")
    update_data = {k: v for k, v in profile_in.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await profiles_col.update_one(
        {"user_id": current_user["_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return await get_profile(current_user=current_user)
