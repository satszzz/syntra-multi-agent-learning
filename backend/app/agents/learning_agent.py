import json
import re
from datetime import datetime
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.agents.llm_client import llm_client

class LearningAgent:
    """Specialized Pedagogical Agent for conceptual explanations, real-world analogies, and interactive tutoring."""
    def __init__(self):
        self.name = "Learning Agent"

    async def execute(self, state: AgentState) -> AgentState:
        topic = state.get("current_topic") or state.get("user_message") or state.get("subject", "Topic")
        subject = state.get("subject", "Computer Networks")
        student_level = state.get("student_level", "Intermediate")
        retrieved_context = state.get("retrieved_context", [])
        
        logs = list(state.get("agent_logs", []))
        logs.append({
            "agent_name": self.name,
            "action": f"Synthesizing pedagogical breakdown for '{topic}' tailored to {student_level} level.",
            "status": "starting",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        explanation_data = await self.explain_concept(
            topic=topic,
            subject=subject,
            student_level=student_level,
            retrieved_context=retrieved_context
        )
        
        logs.append({
            "agent_name": self.name,
            "action": f"Generated interactive explanation with real-world analogy and quick-check practice question.",
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        state["agent_logs"] = logs
        state["final_response"] = explanation_data.get("explanation", "")
        # Save payload in state
        state["current_learning_payload"] = explanation_data
        return state

    async def explain_concept(
        self,
        topic: str,
        subject: str,
        student_level: str = "Intermediate",
        retrieved_context: List[Dict[str, Any]] = None,
        action: str = "explain"
    ) -> Dict[str, Any]:
        
        context_str = ""
        citations = []
        if retrieved_context:
            context_str = "\n\n=== RETRIEVED STUDENT STUDY MATERIAL ===\n"
            for c in retrieved_context[:3]:
                doc_name = c.get("document_name", "Document")
                page = c.get("page_number", 1)
                context_str += f"[{doc_name} (p.{page})]: {c.get('snippet')}\n"
                citations.append(f"{doc_name} (Page {page})")

        system_prompt = f"""You are the SYNTRA Learning Agent, an expert AI tutor.
Generate an educational, clear, and structured response in valid JSON.
Topic: {topic}
Subject: {subject}
Student Level: {student_level}
Action Mode: {action} (explain | simplify | example | quick_check)
{context_str}

Required JSON format:
{{
  "topic": "{topic}",
  "explanation": "Clear structured explanation with markdown bullet points if helpful",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "real_world_example": "Concrete intuitive real-world analogy or industry example",
  "practice_question": {{
    "question": "A concise check question testing the core concept",
    "options": ["A", "B", "C", "D"],
    "correct_option": "A",
    "explanation": "Why option A is correct"
  }},
  "suggested_next_topics": ["Next topic 1", "Next topic 2"]
}}"""

        user_prompt = f"Teach me '{topic}' in {subject}."
        raw_res = await llm_client.generate_response(system_prompt, user_prompt)
        
        try:
            match = re.search(r'\{.*\}', raw_res, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                parsed["citations"] = list(set(citations))
                if "mind_map" not in parsed or not parsed["mind_map"]:
                    parsed["mind_map"] = self._generate_mind_map(
                        topic=topic,
                        key_points=parsed.get("key_points", []),
                        real_world_example=parsed.get("real_world_example", ""),
                        next_topics=parsed.get("suggested_next_topics", [])
                    )
                return parsed
        except Exception as e:
            print(f"[LearningAgent] Parse fallback: {e}")

        # Fallback rich educational response
        fallback_keys = [
            f"Core definition: {topic} provides structure and reliability in communication protocols.",
            "Separation of concerns: It isolates network complexity into modular functional steps.",
            "Efficiency: Reduces network congestion, eliminates redundant routing loops, and optimizes bandwidth.",
            "Standard compliance: Follows IEEE and IETF RFC industry specifications."
        ]
        fallback_next = ["Subnet Masking", "Routing Information Protocol", "OSPF Link State"]

        return {
            "topic": topic,
            "explanation": f"**{topic}** is a critical foundational concept in **{subject}**.\n\n"
                           f"When studying this topic, it is essential to understand both its theoretical purpose and its practical application in modern networks. "
                           f"Key mechanisms include deterministic addressing, efficient path calculation, and failure handling.",
            "key_points": fallback_keys,
            "real_world_example": f"Think of {topic} like a modern postal distribution hub. Instead of individual mail carriers wandering randomly between cities, letters are routed through hierarchical postal codes (network prefixes) and sorting hubs (routers) to deliver packets along optimal paths.",
            "practice_question": {
                "question": f"Which of the following best describes the primary objective of {topic}?",
                "options": [
                    "To optimize resource allocation and ensure predictable, loop-free packet delivery",
                    "To permanently compress data payloads at the physical layer",
                    "To bypass firewall security rules automatically",
                    "To replace IP addressing with MAC addresses across the entire Internet"
                ],
                "correct_option": "To optimize resource allocation and ensure predictable, loop-free packet delivery",
                "explanation": "The primary goal is structured organization, resource optimization, and deterministic data flow."
            },
            "suggested_next_topics": fallback_next,
            "citations": list(set(citations)),
            "mind_map": self._generate_mind_map(topic, fallback_keys, "", fallback_next)
        }

    def _generate_mind_map(self, topic: str, key_points: List[str], real_world_example: str, next_topics: List[str]) -> Dict[str, Any]:
        """Generate structured hierarchical mind-map branches and sub-nodes."""
        clean_topic = topic.strip()
        
        # Branch 1: Core Principles
        principles = [pt[:55] + ("..." if len(pt) > 55 else "") for pt in key_points[:3]] if key_points else [f"Foundations of {clean_topic}", "Core Functional Roles"]
        
        # Branch 2: Mechanisms & Techniques
        mechanisms = ["Addressing & Prefix Hierarchy", "Deterministic Packet Forwarding", "Validation & Error Trapping"]
        if "subnet" in clean_topic.lower():
            mechanisms = ["Borrowing Host Bits", "Magic Number (256 - Octet)", "Subnet Masks & CIDR (/24-/30)"]
        elif "rout" in clean_topic.lower():
            mechanisms = ["Longest Prefix Match", "Distance Vector (Bellman-Ford)", "Link-State (Dijkstra SPF)"]
        elif "osi" in clean_topic.lower() or "tcp" in clean_topic.lower():
            mechanisms = ["Layer Encapsulation (L2-L4)", "TCP 3-Way Handshake", "Port Numbers & Multiplexing"]

        # Branch 3: Practical Application
        applications = [
            "Minimizing Network Congestion",
            "Broadcast Domain Isolation",
            "Enterprise WAN/LAN Segmentation"
        ]
        
        # Branch 4: Extensions & Next Concepts
        extensions = next_topics[:3] if next_topics else ["Advanced Protocol Drills", "Performance Optimization"]
        
        return {
            "root": clean_topic,
            "branches": [
                {
                    "id": "branch_principles",
                    "title": "Core Principles",
                    "icon": "Layers",
                    "color": "#38bdf8",
                    "nodes": [{"id": f"p_{i}", "label": p} for i, p in enumerate(principles)]
                },
                {
                    "id": "branch_mechanisms",
                    "title": "Formulas & Mechanisms",
                    "icon": "Cpu",
                    "color": "#818cf8",
                    "nodes": [{"id": f"m_{i}", "label": m} for i, m in enumerate(mechanisms)]
                },
                {
                    "id": "branch_applications",
                    "title": "Real-World Architecture",
                    "icon": "Zap",
                    "color": "#34d399",
                    "nodes": [{"id": f"a_{i}", "label": a} for i, a in enumerate(applications)]
                },
                {
                    "id": "branch_extensions",
                    "title": "Next Milestones",
                    "icon": "GitBranch",
                    "color": "#fbbf24",
                    "nodes": [{"id": f"e_{i}", "label": e} for i, e in enumerate(extensions)]
                }
            ]
        }


learning_agent = LearningAgent()
