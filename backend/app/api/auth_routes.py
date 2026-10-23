import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.database.db import get_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister):
    users_col = get_collection("users")
    profiles_col = get_collection("student_profiles")
    
    existing = await users_col.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    user_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()
    
    user_doc = {
        "_id": user_id,
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": get_password_hash(user_in.password),
        "preferred_learning_style": user_in.preferred_learning_style or "Visual & Interactive",
        "created_at": now_str
    }
    await users_col.insert_one(user_doc)
    
    # Initialize student profile
    profile_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": user_in.name,
        "current_goal_id": None,
        "strong_topics": ["OSI Model", "TCP/IP"],
        "weak_topics": ["Subnetting", "Routing"],
        "preferred_learning_style": user_in.preferred_learning_style or "Visual & Interactive",
        "overall_progress": 0.0,
        "total_study_minutes": 0,
        "quizzes_taken": 0,
        "average_quiz_score": 0.0,
        "completed_topics": [],
        "updated_at": now_str
    }
    await profiles_col.insert_one(profile_doc)
    
    token = create_access_token({"sub": user_id})
    user_resp = UserResponse(
        id=user_id,
        name=user_in.name,
        email=user_in.email.lower(),
        created_at=now_str,
        preferred_learning_style=user_in.preferred_learning_style
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login(login_in: UserLogin):
    users_col = get_collection("users")
    user = await users_col.find_one({"email": login_in.email.lower()})
    
    if not user or not verify_password(login_in.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )
        
    token = create_access_token({"sub": user["_id"]})
    user_resp = UserResponse(
        id=user["_id"],
        name=user["name"],
        email=user["email"],
        created_at=user.get("created_at", datetime.utcnow().isoformat()),
        preferred_learning_style=user.get("preferred_learning_style", "Visual & Interactive")
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.post("/demo-login", response_model=TokenResponse)
async def demo_login():
    """1-Click instant login for demonstration and grading evaluation."""
    users_col = get_collection("users")
    profiles_col = get_collection("student_profiles")
    
    demo_user = await users_col.find_one({"email": "demo.student@syntra.ai"})
    if not demo_user:
        user_id = "demo_user_id_101"
        now_str = datetime.utcnow().isoformat()
        demo_user = {
            "_id": user_id,
            "name": "Satheeswaran",
            "email": "demo.student@syntra.ai",
            "password_hash": get_password_hash("syntra123"),
            "preferred_learning_style": "Visual & Interactive",
            "created_at": now_str
        }
        await users_col.insert_one(demo_user)
        
        # Profile
        profile_doc = {
            "_id": "demo_profile_id_101",
            "user_id": user_id,
            "name": "Satheeswaran",
            "current_goal_id": None,
            "strong_topics": ["OSI Model", "TCP/IP"],
            "weak_topics": ["Subnetting", "Routing"],
            "preferred_learning_style": "Visual & Interactive",
            "overall_progress": 45.0,
            "total_study_minutes": 240,
            "quizzes_taken": 2,
            "average_quiz_score": 70.0,
            "completed_topics": ["OSI Model Overview", "IPv4 Header Structure"],
            "updated_at": now_str
        }
        await profiles_col.insert_one(profile_doc)
    else:
        user_id = demo_user["_id"]

    token = create_access_token({"sub": user_id})
    user_resp = UserResponse(
        id=user_id,
        name=demo_user["name"],
        email=demo_user["email"],
        created_at=demo_user.get("created_at", datetime.utcnow().isoformat()),
        preferred_learning_style=demo_user.get("preferred_learning_style", "Visual & Interactive")
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user.get("created_at", datetime.utcnow().isoformat()),
        preferred_learning_style=current_user.get("preferred_learning_style", "Visual & Interactive")
    )
