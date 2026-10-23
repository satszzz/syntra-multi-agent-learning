import json
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.agents.state import AgentState
from app.agents.llm_client import llm_client

class PlanningAgent:
    """Specialized Planning Agent for personalized schedule generation and adaptive rebalancing."""
    def __init__(self):
        self.name = "Planning Agent"

    async def execute(self, state: AgentState) -> AgentState:
        action_type = state.get("action_type", "goal_plan")
        is_adapting = action_type == "adapt_plan" or bool(state.get("quiz_result"))
        
        logs = list(state.get("agent_logs", []))
        subject = state.get("subject", "Computer Networks")
        days = state.get("days_remaining", 7)
        weak_topics = state.get("weak_topics", [])
        daily_hours = state.get("daily_study_hours", 2.0)
        
        if is_adapting:
            logs.append({
                "agent_name": self.name,
                "action": f"Analyzing quiz weakness profile for '{subject}'. Initiating adaptive schedule rebalance.",
                "status": "starting",
                "timestamp": datetime.utcnow().isoformat()
            })
            plan = await self._adapt_study_plan(state)
            logs.append({
                "agent_name": self.name,
                "action": f"Adapted study plan: Injected remedial drills and extra review for weak topics ({', '.join(weak_topics)}).",
                "status": "completed",
                "details": f"Updated {len(plan.get('schedule', []))} day slots with high-yield focus.",
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            logs.append({
                "agent_name": self.name,
                "action": f"Creating {days}-day personalized curriculum for {subject} with focus on weak areas ({', '.join(weak_topics) if weak_topics else 'Balanced'}).",
                "status": "starting",
                "timestamp": datetime.utcnow().isoformat()
            })
            plan = await self._create_initial_plan(state)
            logs.append({
                "agent_name": self.name,
                "action": f"Generated structured {len(plan.get('schedule', []))}-day learning roadmap with topic time allocations.",
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat()
            })
            
        state["study_plan"] = plan
        state["agent_logs"] = logs
        return state

    async def _create_initial_plan(self, state: AgentState) -> Dict[str, Any]:
        subject = state.get("subject", "Computer Networks")
        days = max(1, min(30, state.get("days_remaining", 7)))
        weak_topics = state.get("weak_topics", ["Subnetting", "Routing"])
        student_level = state.get("student_level", "Intermediate")
        daily_hours = state.get("daily_study_hours", 2.0)
        
        system_prompt = f"""You are the SYNTRA Planning Agent. Output ONLY a valid JSON object representing a {days}-day study plan for '{subject}'.
Student Level: {student_level}
Daily Study Time: {daily_hours} hours
Prioritize Weak Topics: {', '.join(weak_topics)}

JSON format:
{{
  "summary": "...",
  "days": [
    {{
      "day_number": 1,
      "title": "...",
      "focus": "...",
      "topics": [
        {{
          "name": "...",
          "difficulty": "Easy|Medium|Hard",
          "estimated_minutes": 60,
          "is_weak_area": true|false,
          "subtopics": ["..."]
        }}
      ]
    }}
  ]
}}"""
        user_prompt = f"Build study plan for {days} days on {subject}."
        raw_res = await llm_client.generate_response(system_prompt, user_prompt)
        
        parsed_days = self._parse_days_json(raw_res, days, subject, weak_topics)
        
        # Build full study plan schema
        now = datetime.utcnow()
        schedule = []
        for i, d in enumerate(parsed_days):
            day_date = (now + timedelta(days=i)).strftime("%Y-%m-%d")
            topics_list = []
            for t_idx, t in enumerate(d.get("topics", [])):
                topics_list.append({
                    "topic_id": f"top_{i+1}_{t_idx+1}_{str(uuid.uuid4())[:4]}",
                    "name": t.get("name", f"Topic {t_idx+1}"),
                    "difficulty": t.get("difficulty", "Medium"),
                    "estimated_minutes": t.get("estimated_minutes", int(daily_hours * 60 / max(1, len(d.get("topics", []))))),
                    "is_weak_area": any(w.lower() in t.get("name", "").lower() for w in weak_topics) or t.get("is_weak_area", False),
                    "is_completed": False,
                    "notes": t.get("notes", ""),
                    "subtopics": t.get("subtopics", [])
                })
            
            schedule.append({
                "day_number": i + 1,
                "date": day_date,
                "title": d.get("title", f"Day {i+1}: Core Learning"),
                "focus": d.get("focus", f"Mastery of {subject} concepts"),
                "topics": topics_list,
                "is_revision": i == days - 2 if days > 2 else False,
                "is_mock_test": i == days - 1 if days > 1 else False,
                "is_completed": False
            })

        plan_id = str(uuid.uuid4())
        return {
            "id": plan_id,
            "goal_id": state.get("goal_id", str(uuid.uuid4())),
            "user_id": state.get("user_id", "user_1"),
            "subject": subject,
            "total_days": days,
            "version": 1,
            "schedule": schedule,
            "is_adapted": False,
            "adaptation_reason": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

    async def _adapt_study_plan(self, state: AgentState) -> Dict[str, Any]:
        """Mutate and re-prioritize schedule based on diagnostic or quiz weaknesses."""
        existing_plan = state.get("study_plan")
        weak_topics = state.get("weak_topics", [])
        quiz_result = state.get("quiz_result", {})
        
        if quiz_result and quiz_result.get("identified_weak_topics"):
            weak_topics = list(set(weak_topics + quiz_result["identified_weak_topics"]))
            
        subject = state.get("subject", "Computer Networks")
        
        if not existing_plan or "schedule" not in existing_plan:
            return await self._create_initial_plan(state)
            
        schedule = existing_plan["schedule"]
        
        # Adaptive strategy:
        # 1. Flag all weak topics in current & future days.
        # 2. Add targeted remedial practice and diagnostic sessions into mid & late days.
        for day in schedule:
            for topic in day.get("topics", []):
                for w in weak_topics:
                    if w.lower() in topic["name"].lower() or topic["name"].lower() in w.lower():
                        topic["is_weak_area"] = True
                        topic["difficulty"] = "Hard"
                        topic["notes"] = f"Adaptive Focus: Identified knowledge gap in recent assessment."
                        
        # Insert dedicated remedial workshop before the final mock test if days allow
        if len(schedule) >= 4:
            target_idx = max(0, len(schedule) - 2)
            remedial_topics = [
                {
                    "topic_id": f"adaptive_drill_{str(uuid.uuid4())[:4]}",
                    "name": f"Adaptive Remediation: {w} Intensive Problem Solving",
                    "difficulty": "Hard",
                    "estimated_minutes": 60,
                    "is_weak_area": True,
                    "is_completed": False,
                    "notes": "System-generated adaptive module based on evaluation results",
                    "subtopics": ["Step-by-step problem walkthrough", "Common trap questions", "Self-test"]
                }
                for w in weak_topics[:2]
            ]
            schedule[target_idx]["title"] = f"Adaptive Intensive Review: {', '.join(weak_topics)}"
            schedule[target_idx]["focus"] = f"Remediating identified weak spots before final exam"
            schedule[target_idx]["topics"] = remedial_topics + [t for t in schedule[target_idx]["topics"] if not t.get("is_weak_area")]

        adapted_plan = dict(existing_plan)
        adapted_plan["version"] = existing_plan.get("version", 1) + 1
        adapted_plan["is_adapted"] = True
        adapted_plan["adaptation_reason"] = f"Adaptive adjustment triggered: Enhanced practice for weak topics ({', '.join(weak_topics)})."
        adapted_plan["updated_at"] = datetime.utcnow().isoformat()
        adapted_plan["schedule"] = schedule
        return adapted_plan

    def _parse_days_json(self, raw_text: str, total_days: int, subject: str, weak_topics: List[str]) -> List[Dict[str, Any]]:
        try:
            # Extract JSON substring
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                if "days" in parsed and isinstance(parsed["days"], list):
                    return parsed["days"][:total_days]
        except Exception as e:
            print(f"[PlanningAgent] JSON parse fallback: {e}")

        # Fallback default structured schedule
        fallback_days = []
        core_topics = [
            ("OSI Model & Physical/Data Link Layers", "Easy", ["7 Layers", "MAC Address"]),
            ("IP Addressing & CIDR Principles", "Medium", ["IPv4 Header", "Classes"]),
            ("Subnetting (FLSM & VLSM Mastery)", "Hard", ["Borrowing Bits", "Magic Number", "Host Range"]),
            ("Routing Protocols & Distance Vector (RIP)", "Hard", ["Routing Tables", "Split Horizon"]),
            ("Link State Routing (OSPF) & Dijkstra", "Hard", ["LSA Packets", "Areas"]),
            ("Transport Layer (TCP Handshake & UDP)", "Medium", ["3-Way Handshake", "Port Numbers"]),
            ("Comprehensive Final Revision & Mock Exam", "Hard", ["Mock Exam", "Formula Review"])
        ]
        
        for i in range(total_days):
            t_name, diff, sub = core_topics[i % len(core_topics)]
            is_weak = any(w.lower() in t_name.lower() for w in weak_topics)
            fallback_days.append({
                "day_number": i + 1,
                "title": f"Day {i+1}: {t_name}",
                "focus": f"Mastery of {t_name}",
                "topics": [
                    {
                        "name": t_name,
                        "difficulty": diff if not is_weak else "Hard",
                        "estimated_minutes": 90,
                        "is_weak_area": is_weak,
                        "subtopics": sub
                    }
                ]
            })
        return fallback_days

planning_agent = PlanningAgent()
