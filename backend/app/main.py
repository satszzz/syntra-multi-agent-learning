import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config.settings import settings
from app.database.db import db_manager
from app.api.auth_routes import router as auth_router
from app.api.student_routes import router as student_router
from app.api.goal_routes import router as goal_router
from app.api.study_plan_routes import router as study_plan_router
from app.api.document_routes import router as document_router
from app.api.quiz_routes import router as quiz_router
from app.api.agent_routes import router as agent_router
from app.api.analytics_routes import router as analytics_router
from app.api.agent_activity_routes import router as agent_activity_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    await db_manager.connect()
    yield
    # Shutdown: Disconnect DB
    await db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SYNTRA - A Multi-Agent Framework for Autonomous and Personalized Learning",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/production flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads if exists
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(student_router, prefix=settings.API_V1_STR)
app.include_router(goal_router, prefix=settings.API_V1_STR)
app.include_router(study_plan_router, prefix=settings.API_V1_STR)
app.include_router(document_router, prefix=settings.API_V1_STR)
app.include_router(quiz_router, prefix=settings.API_V1_STR)
app.include_router(agent_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(agent_activity_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "framework": "SYNTRA",
        "title": "A Multi-Agent Framework for Autonomous and Personalized Learning",
        "status": "online",
        "version": settings.VERSION,
        "agents": [
            "Supervisor / Orchestrator Agent",
            "Learning Agent",
            "Knowledge / RAG Agent",
            "Planning Agent",
            "Evaluation Agent"
        ],
        "database": "MongoDB / Local Persistence Adapter",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "demo_mode": settings.DEMO_MODE,
        "llm_model": settings.LLM_MODEL
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
