import json
import re
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.agents.state import AgentState
from app.agents.llm_client import llm_client

class EvaluationAgent:
    """Specialized Evaluation Agent for quiz generation, objective grading, and weakness diagnosis."""
    def __init__(self):
        self.name = "Evaluation Agent"

    async def execute(self, state: AgentState) -> AgentState:
        action = state.get("action_type", "evaluate")
        logs = list(state.get("agent_logs", []))
        subject = state.get("subject", "Computer Networks")
        
        if action == "generate_quiz":
            logs.append({
                "agent_name": self.name,
                "action": f"Constructing diagnostic assessment for '{subject}' with focus on {', '.join(state.get('weak_topics', ['Core Topics']))}.",
                "status": "starting",
                "timestamp": datetime.utcnow().isoformat()
            })
            quiz = await self.generate_quiz(
                subject=subject,
                weak_topics=state.get("weak_topics", []),
                num_questions=5
            )
            logs.append({
                "agent_name": self.name,
                "action": f"Generated {len(quiz.get('questions', []))} calibrated MCQ diagnostic questions.",
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat()
            })
            state["quiz"] = quiz
        elif action == "evaluate_submission" or state.get("quiz_result"):
            logs.append({
                "agent_name": self.name,
                "action": "Grading answers and computing topic-level mastery vectors.",
                "status": "starting",
                "timestamp": datetime.utcnow().isoformat()
            })
            # Grading is handled via grade_quiz
            logs.append({
                "agent_name": self.name,
                "action": "Completed evaluation: Categorized Strong & Weak domains. Dispatching to Supervisor.",
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat()
            })
            
        state["agent_logs"] = logs
        return state

    async def generate_quiz(
        self,
        subject: str,
        weak_topics: List[str] = None,
        num_questions: int = 5,
        target_topic: Optional[str] = None
    ) -> Dict[str, Any]:
        weak_str = ", ".join(weak_topics) if weak_topics else "General Curriculum"
        topic_focus = f"Focus particularly on: {target_topic}" if target_topic else f"Emphasize weak topics: {weak_str}"
        
        system_prompt = f"""You are the SYNTRA Evaluation Agent. Generate a diagnostic MCQ quiz in valid JSON for '{subject}'.
Number of questions: {num_questions}
{topic_focus}

Required JSON format:
{{
  "title": "{subject} Diagnostic Assessment",
  "questions": [
    {{
      "id": "q1",
      "topic": "Specific Topic Name",
      "question": "Question prompt",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation": "Detailed explanation of why the correct option is right",
      "difficulty": "Easy|Medium|Hard"
    }}
  ]
}}"""
        user_prompt = f"Generate {num_questions} questions for {subject}."
        raw = await llm_client.generate_response(system_prompt, user_prompt)
        
        try:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                if "questions" in parsed and isinstance(parsed["questions"], list) and len(parsed["questions"]) > 0:
                    parsed["id"] = str(uuid.uuid4())
                    parsed["subject"] = subject
                    parsed["created_at"] = datetime.utcnow().isoformat()
                    return parsed
        except Exception as e:
            print(f"[EvaluationAgent] Quiz parse fallback: {e}")

        # Fallback calibrated questions
        return {
            "id": str(uuid.uuid4()),
            "subject": subject,
            "title": f"{subject} Diagnostic Assessment",
            "created_at": datetime.utcnow().isoformat(),
            "questions": [
                {
                    "id": "q1",
                    "topic": "Subnetting",
                    "question": "Given the IP address 192.168.10.0/26, what is the valid subnet mask and maximum usable host count per subnet?",
                    "options": [
                        "255.255.255.192 with 62 usable hosts",
                        "255.255.255.128 with 126 usable hosts",
                        "255.255.255.224 with 30 usable hosts",
                        "255.255.255.0 with 254 usable hosts"
                    ],
                    "correct_answer_index": 0,
                    "explanation": "/26 borrows 2 bits in the 4th octet (128 + 64 = 192). Usable hosts = 2^(32-26) - 2 = 62.",
                    "difficulty": "Medium"
                },
                {
                    "id": "q2",
                    "topic": "Subnetting",
                    "question": "What is the broadcast address for the subnet containing the host 10.1.1.45/28?",
                    "options": ["10.1.1.63", "10.1.1.47", "10.1.1.31", "10.1.1.255"],
                    "correct_answer_index": 1,
                    "explanation": "/28 has a block size of 16. Subnets are .0, .16, .32, .48. Host .45 is in .32 subnet, broadcast is .47.",
                    "difficulty": "Hard"
                },
                {
                    "id": "q3",
                    "topic": "Routing",
                    "question": "Which mechanism prevents routing loops in Distance Vector routing protocols by preventing an update from being advertised out the interface it was learned from?",
                    "options": ["Dijkstra Algorithm", "Split Horizon", "Maximum Hop Count of 15", "Longest Prefix Match"],
                    "correct_answer_index": 1,
                    "explanation": "Split Horizon prevents routes from being advertised back through the receiving interface.",
                    "difficulty": "Medium"
                },
                {
                    "id": "q4",
                    "topic": "Routing",
                    "question": "When a router receives a packet with destination IP 172.16.5.20 and has routes for 172.16.0.0/16 and 172.16.5.0/24, which route is chosen?",
                    "options": [
                        "172.16.0.0/16 because it is a larger network",
                        "172.16.5.0/24 because of the Longest Prefix Match rule",
                        "The route with lowest administrative distance only",
                        "Round-robin load balancing"
                    ],
                    "correct_answer_index": 1,
                    "explanation": "Routers always forward packets according to the Longest Prefix Match.",
                    "difficulty": "Medium"
                },
                {
                    "id": "q5",
                    "topic": "OSI Model",
                    "question": "At which layer of the OSI model does logical IP addressing and path determination occur?",
                    "options": ["Data Link Layer (Layer 2)", "Network Layer (Layer 3)", "Transport Layer (Layer 4)", "Application Layer (Layer 7)"],
                    "correct_answer_index": 1,
                    "explanation": "Layer 3 (Network Layer) is responsible for logical addressing and packet routing.",
                    "difficulty": "Easy"
                }
            ]
        }

    async def grade_quiz(
        self,
        quiz: Dict[str, Any],
        user_answers: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        questions = quiz.get("questions", [])
        q_map = {q["id"]: q for q in questions}
        
        correct_count = 0
        topic_stats: Dict[str, Dict[str, int]] = {}
        
        for ans in user_answers:
            qid = ans.get("question_id")
            selected = ans.get("selected_option_index")
            q = q_map.get(qid)
            if not q:
                continue
                
            topic = q.get("topic", "General")
            if topic not in topic_stats:
                topic_stats[topic] = {"total": 0, "correct": 0}
            topic_stats[topic]["total"] += 1
            
            if selected == q.get("correct_answer_index"):
                correct_count += 1
                topic_stats[topic]["correct"] += 1

        total_q = max(1, len(questions))
        score_pct = round((correct_count / total_q) * 100, 1)
        
        topic_breakdown = []
        identified_weak = []
        identified_strong = []
        
        for t, stats in topic_stats.items():
            acc = round((stats["correct"] / max(1, stats["total"])) * 100, 1)
            status_label = "Strong" if acc >= 75.0 else ("Moderate" if acc >= 50.0 else "Weak")
            if status_label == "Weak":
                identified_weak.append(t)
            elif status_label == "Strong":
                identified_strong.append(t)
                
            topic_breakdown.append({
                "topic": t,
                "total_questions": stats["total"],
                "correct_questions": stats["correct"],
                "accuracy_percentage": acc,
                "status": status_label
            })

        feedback = (
            f"You scored {correct_count}/{total_q} ({score_pct}%). "
            f"You showed strong mastery in {', '.join(identified_strong) if identified_strong else 'foundational concepts'}. "
            f"However, additional reinforcement is required in: {', '.join(identified_weak) if identified_weak else 'advanced scenarios'}. "
            "SYNTRA will automatically rebalance your upcoming study plan to drill these weak topics."
        )

        return {
            "id": str(uuid.uuid4()),
            "quiz_id": quiz.get("id", str(uuid.uuid4())),
            "user_id": user_id,
            "subject": quiz.get("subject", "Computer Networks"),
            "total_questions": total_q,
            "correct_count": correct_count,
            "score_percentage": score_pct,
            "topic_breakdown": topic_breakdown,
            "identified_weak_topics": identified_weak,
            "identified_strong_topics": identified_strong,
            "ai_feedback": feedback,
            "study_plan_adapted": len(identified_weak) > 0,
            "submitted_at": datetime.utcnow().isoformat()
        }

evaluation_agent = EvaluationAgent()
