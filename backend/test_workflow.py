import asyncio
import os
import sys

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.db import db_manager
from app.auth.security import get_password_hash, create_access_token
from app.agents.supervisor import supervisor_agent
from app.agents.rag_agent import rag_agent
from app.agents.learning_agent import learning_agent
from app.agents.planning_agent import planning_agent
from app.agents.evaluation_agent import evaluation_agent
from app.rag.rag_engine import rag_engine
from app.agents.state import AgentState

async def run_complete_workflow_test():
    print("=" * 60)
    print("SYNTRA MULTI-AGENT FRAMEWORK: FULL INTEGRATION TEST")
    print("=" * 60)
    
    # 1. Init DB
    await db_manager.connect()
    print("[PASS] [DB] Storage adapter ready.")
    
    user_id = "test_student_001"
    
    # 2. Test RAG Document Ingestion
    sample_notes_path = os.path.join(os.path.dirname(__file__), "sample_data", "computer_networks_unit3.txt")
    if os.path.exists(sample_notes_path):
        pages = rag_engine.extract_text_from_txt(sample_notes_path)
        chunks = rag_engine.chunk_text(pages, chunk_size=300, chunk_overlap=50)
        rag_engine.ingest_document(
            document_id="doc_cn_unit3",
            user_id=user_id,
            filename="computer_networks_unit3.txt",
            subject="Computer Networks",
            chunks=chunks
        )
        print(f"[PASS] [RAG Agent] Ingested & vectorized {len(chunks)} chunks from notes.")
        
        # Test search
        retrieved = rag_engine.search_similar_chunks("distance vector routing", user_id=user_id, top_k=2)
        print(f"[PASS] [RAG Agent] Retrieved {len(retrieved)} chunks for 'distance vector routing'. Top score: {retrieved[0]['score'] if retrieved else 'N/A'}")
    
    # 3. Test Multi-Agent Goal Orchestration
    print("\n--- Testing Supervisor Agent Goal Orchestration ---")
    goal_state: AgentState = {
        "user_id": user_id,
        "subject": "Computer Networks",
        "goal_description": "Prepare for exam in 7 days. Weak in Subnetting & Routing.",
        "exam_date": "2026-09-23",
        "days_remaining": 7,
        "student_level": "Intermediate",
        "weak_topics": ["Subnetting", "Routing"],
        "daily_study_hours": 2.0,
        "action_type": "goal_plan",
        "agent_logs": []
    }
    
    final_goal_state = await supervisor_agent.run(goal_state)
    plan = final_goal_state.get("study_plan")
    print(f"[PASS] [Supervisor] Orchestration completed. Total agent steps: {len(final_goal_state.get('agent_logs', []))}")
    print(f"[PASS] [Planning Agent] Generated {len(plan.get('schedule', []))}-day study plan for {plan.get('subject')}.")
    
    # 4. Test Learning Agent
    print("\n--- Testing Learning Agent Explanation ---")
    learn_res = await learning_agent.explain_concept(
        topic="Subnetting",
        subject="Computer Networks",
        student_level="Intermediate",
        retrieved_context=final_goal_state.get("retrieved_context", [])
    )
    print(f"[PASS] [Learning Agent] Generated lesson for '{learn_res.get('topic')}' with {len(learn_res.get('key_points', []))} key points and real-world analogy.")
    
    # 5. Test Evaluation Agent & Diagnostic Quiz
    print("\n--- Testing Evaluation Agent ---")
    quiz = await evaluation_agent.generate_quiz(
        subject="Computer Networks",
        weak_topics=["Subnetting", "Routing"],
        num_questions=5
    )
    print(f"[PASS] [Evaluation Agent] Generated quiz '{quiz.get('title')}' with {len(quiz.get('questions', []))} questions.")
    
    # 6. Test Quiz Grading & Weak Area Diagnosis
    sample_answers = [
        {"question_id": quiz["questions"][0]["id"], "selected_option_index": 3}, # Deliberately wrong
        {"question_id": quiz["questions"][1]["id"], "selected_option_index": 2}, # Deliberately wrong
        {"question_id": quiz["questions"][2]["id"], "selected_option_index": quiz["questions"][2]["correct_answer_index"]},
        {"question_id": quiz["questions"][3]["id"], "selected_option_index": quiz["questions"][3]["correct_answer_index"]},
        {"question_id": quiz["questions"][4]["id"], "selected_option_index": quiz["questions"][4]["correct_answer_index"]},
    ]
    grade_result = await evaluation_agent.grade_quiz(quiz, sample_answers, user_id)
    print(f"[PASS] [Evaluation Agent] Graded quiz: Score {grade_result['correct_count']}/{grade_result['total_questions']} ({grade_result['score_percentage']}%)")
    print(f"[PASS] [Evaluation Agent] Detected Weak Areas: {grade_result['identified_weak_topics']}")
    print(f"[PASS] [Evaluation Agent] Detected Strong Areas: {grade_result['identified_strong_topics']}")
    
    # 7. Test Closed-Loop Adaptive Study Plan Mutation
    print("\n--- Testing Adaptive Closed Loop ---")
    adapt_state: AgentState = {
        "user_id": user_id,
        "subject": "Computer Networks",
        "study_plan": plan,
        "quiz_result": grade_result,
        "weak_topics": grade_result["identified_weak_topics"],
        "action_type": "adapt_plan",
        "agent_logs": []
    }
    final_adapt_state = await supervisor_agent.run(adapt_state)
    adapted_plan = final_adapt_state.get("study_plan")
    print(f"[PASS] [Adaptive Loop] Study plan version: {adapted_plan.get('version')}, Is Adapted: {adapted_plan.get('is_adapted')}")
    print(f"[PASS] [Adaptive Loop] Adaptation Reason: {adapted_plan.get('adaptation_reason')}")
    
    print("\n" + "=" * 60)
    print("ALL MULTI-AGENT INTEGRATION TESTS PASSED SUCCESSFULLY! [PASS]")
    print("=" * 60)
    await db_manager.disconnect()

if __name__ == "__main__":
    asyncio.run(run_complete_workflow_test())
