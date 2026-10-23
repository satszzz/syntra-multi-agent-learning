from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Auth & User ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    preferred_learning_style: Optional[str] = "Visual & Interactive"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: str
    preferred_learning_style: Optional[str] = "Visual & Interactive"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Student Profile ---
class StudentProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    current_goal_id: Optional[str] = None
    strong_topics: List[str] = []
    weak_topics: List[str] = []
    preferred_learning_style: str = "Visual & Interactive"
    overall_progress: float = 0.0
    total_study_minutes: int = 0
    quizzes_taken: int = 0
    average_quiz_score: float = 0.0
    completed_topics: List[str] = []
    updated_at: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_learning_style: Optional[str] = None
    strong_topics: Optional[List[str]] = None
    weak_topics: Optional[List[str]] = None


# --- Learning Goals ---
class LearningGoalCreate(BaseModel):
    subject: str = Field(..., example="Computer Networks")
    goal_description: str = Field(..., example="Prepare for my semester exam in 7 days")
    exam_date: str = Field(..., example="2026-09-23")
    student_level: str = Field("Intermediate", example="Beginner | Intermediate | Advanced")
    weak_topics: List[str] = Field(default_factory=list, example=["Subnetting", "Routing"])
    daily_study_hours: float = Field(2.0, ge=0.5, le=12.0)
    include_rag: bool = True

class LearningGoalResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    goal_description: str
    exam_date: str
    student_level: str
    weak_topics: List[str]
    daily_study_hours: float
    days_remaining: int
    status: str = "active"
    created_at: str
    study_plan_id: Optional[str] = None


# --- Study Plans ---
class StudyTopic(BaseModel):
    topic_id: str
    name: str
    difficulty: str = "Medium" # Easy, Medium, Hard
    estimated_minutes: int = 60
    is_weak_area: bool = False
    is_completed: bool = False
    notes: Optional[str] = None
    subtopics: List[str] = []

class StudyDayPlan(BaseModel):
    day_number: int
    date: str
    title: str
    focus: str
    topics: List[StudyTopic]
    is_revision: bool = False
    is_mock_test: bool = False
    is_completed: bool = False

class StudyPlan(BaseModel):
    id: str
    user_id: str
    goal_id: str
    subject: str
    total_days: int
    version: int = 1
    schedule: List[StudyDayPlan]
    is_adapted: bool = False
    adaptation_reason: Optional[str] = None
    created_at: str
    updated_at: str


# --- Documents & RAG ---
class DocumentMeta(BaseModel):
    id: str
    user_id: str
    filename: str
    file_size_bytes: int
    file_type: str
    total_pages: int = 1
    chunk_count: int = 0
    subject: Optional[str] = None
    upload_timestamp: str
    status: str = "ready" # processing, ready, error

class DocumentQueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    subject: Optional[str] = None
    top_k: int = 4

class DocumentChunkReference(BaseModel):
    document_name: str
    page_number: int
    snippet: str
    score: float

class DocumentQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[DocumentChunkReference]
    used_rag: bool


# --- Quiz & Evaluation ---
class QuizQuestion(BaseModel):
    id: str
    topic: str
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str
    difficulty: str = "Medium"

class Quiz(BaseModel):
    id: str
    goal_id: Optional[str] = None
    subject: str
    title: str
    questions: List[QuizQuestion]
    created_at: str

class QuizAnswerSubmission(BaseModel):
    question_id: str
    selected_option_index: int

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[QuizAnswerSubmission]

class TopicPerformance(BaseModel):
    topic: str
    total_questions: int
    correct_questions: int
    accuracy_percentage: float
    status: str # Strong, Moderate, Weak

class QuizResultResponse(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    subject: str
    total_questions: int
    correct_count: int
    score_percentage: float
    topic_breakdown: List[TopicPerformance]
    identified_weak_topics: List[str]
    identified_strong_topics: List[str]
    ai_feedback: str
    study_plan_adapted: bool = False
    submitted_at: str


# --- Agents & Activity ---
class AgentStepLog(BaseModel):
    agent_name: str
    action: str
    status: str # starting, completed, routed, warning, error
    details: Optional[str] = None
    timestamp: str

class AgentRunRequest(BaseModel):
    goal_id: Optional[str] = None
    message: str
    context_document_ids: Optional[List[str]] = None
    action_type: Optional[str] = "general" # goal_plan, learn_topic, rag_qa, adapt_plan

class AgentRunResponse(BaseModel):
    session_id: str
    supervisor_decision: str
    response_text: str
    agent_steps: List[AgentStepLog]
    data: Optional[Dict[str, Any]] = None


# --- AI Tutor Learn Topic ---
class LearnTopicRequest(BaseModel):
    topic: str
    subject: str
    current_level: Optional[str] = "Intermediate"
    preferred_style: Optional[str] = "Visual & Interactive"
    action: Optional[str] = "explain" # explain, simplify, example, quick_check

class LearnTopicResponse(BaseModel):
    topic: str
    explanation: str
    key_points: List[str]
    real_world_example: str
    practice_question: Optional[Dict[str, Any]] = None
    suggested_next_topics: List[str] = []
    citations: List[str] = []
    mind_map: Optional[Dict[str, Any]] = None

