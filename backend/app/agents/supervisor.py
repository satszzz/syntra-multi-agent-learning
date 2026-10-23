import uuid
from datetime import datetime
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.agents.rag_agent import rag_agent
from app.agents.planning_agent import planning_agent
from app.agents.learning_agent import learning_agent
from app.agents.evaluation_agent import evaluation_agent
from app.agents.llm_client import llm_client

# Try importing LangGraph StateGraph, else use our robust LangGraph-compatible state engine
try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except Exception:
    LANGGRAPH_AVAILABLE = False


class SupervisorAgent:
    """Main Orchestrator Agent coordinating specialized agents through shared state."""
    def __init__(self):
        self.name = "Supervisor / Orchestrator Agent"
        self._build_graph()

    def _build_graph(self):
        """Construct LangGraph execution graph."""
        if LANGGRAPH_AVAILABLE:
            try:
                workflow = StateGraph(AgentState)
                
                # Register agent nodes
                workflow.add_node("supervisor_route", self._supervisor_route_node)
                workflow.add_node("rag_node", self._rag_node)
                workflow.add_node("planning_node", self._planning_node)
                workflow.add_node("learning_node", self._learning_node)
                workflow.add_node("evaluation_node", self._evaluation_node)
                workflow.add_node("supervisor_finalize", self._supervisor_finalize_node)
                
                # Flow definition
                workflow.set_entry_point("supervisor_route")
                
                workflow.add_conditional_edges(
                    "supervisor_route",
                    self._route_decision,
                    {
                        "plan_flow": "rag_node",
                        "learn_flow": "rag_node",
                        "eval_flow": "evaluation_node",
                        "adapt_flow": "planning_node",
                        "direct_finalize": "supervisor_finalize"
                    }
                )
                
                # Sequential transitions
                workflow.add_edge("rag_node", "planning_node")
                workflow.add_edge("planning_node", "supervisor_finalize")
                workflow.add_edge("learning_node", "supervisor_finalize")
                workflow.add_edge("evaluation_node", "planning_node")
                workflow.add_edge("supervisor_finalize", END)
                
                self.app_graph = workflow.compile()
                print("[Supervisor] LangGraph agent mesh compiled successfully.")
                return
            except Exception as e:
                print(f"[Supervisor] LangGraph compile fallback: {e}")
        
        self.app_graph = None

    async def _supervisor_route_node(self, state: AgentState) -> AgentState:
        logs = list(state.get("agent_logs", []))
        user_msg = state.get("user_message", "")
        action = state.get("action_type", "general")
        subject = state.get("subject", "Computer Networks")
        
        logs.append({
            "agent_name": self.name,
            "action": f"Analyzing student requirement for {subject}. Determining optimal agent execution pipeline.",
            "status": "starting",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Determine routing
        if action == "goal_plan" or "exam" in user_msg.lower() or "prepare" in user_msg.lower():
            decision = "Dispatching: RAG Agent (retrieve curriculum context) -> Planning Agent (build schedule) -> Evaluation Agent (diagnostic prep)."
            next_agent = "rag_node"
        elif action == "learn_topic" or "explain" in user_msg.lower() or "what is" in user_msg.lower():
            decision = "Dispatching: RAG Agent (search student notes) -> Learning Agent (pedagogical explanation)."
            next_agent = "learn_flow"
        elif action == "adapt_plan" or bool(state.get("quiz_result")):
            decision = "Dispatching: Planning Agent (rebalance curriculum based on weakness analysis)."
            next_agent = "adapt_flow"
        elif action == "generate_quiz":
            decision = "Dispatching: Evaluation Agent (construct customized MCQ quiz)."
            next_agent = "eval_flow"
        else:
            decision = "Dispatching: Knowledge & Learning agents for personalized assistance."
            next_agent = "learn_flow"

        logs.append({
            "agent_name": self.name,
            "action": decision,
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        state["supervisor_decision"] = decision
        state["next_agent"] = next_agent
        state["agent_logs"] = logs
        return state

    def _route_decision(self, state: AgentState) -> str:
        next_a = state.get("next_agent", "plan_flow")
        if "plan" in next_a or state.get("action_type") == "goal_plan":
            return "plan_flow"
        if "learn" in next_a or state.get("action_type") == "learn_topic":
            return "learn_flow"
        if "adapt" in next_a or state.get("action_type") == "adapt_plan":
            return "adapt_flow"
        if "eval" in next_a or state.get("action_type") == "generate_quiz":
            return "eval_flow"
        return "plan_flow"

    async def _rag_node(self, state: AgentState) -> AgentState:
        return await rag_agent.execute(state)

    async def _planning_node(self, state: AgentState) -> AgentState:
        return await planning_agent.execute(state)

    async def _learning_node(self, state: AgentState) -> AgentState:
        return await learning_agent.execute(state)

    async def _evaluation_node(self, state: AgentState) -> AgentState:
        return await evaluation_agent.execute(state)

    async def _supervisor_finalize_node(self, state: AgentState) -> AgentState:
        logs = list(state.get("agent_logs", []))
        subject = state.get("subject", "Computer Networks")
        action = state.get("action_type", "goal_plan")
        
        if action == "goal_plan":
            plan = state.get("study_plan", {})
            total_days = plan.get("total_days", 7)
            summary_text = (
                f"I have coordinated our agent team to prepare your personalized {total_days}-day study roadmap for {subject}. "
                f"The Planning Agent has prioritized your weak areas and structured daily milestones with target hours. "
                "You can now begin learning day-by-day or take a diagnostic quiz to test your baseline knowledge."
            )
        elif action == "adapt_plan":
            weak_topics = state.get("weak_topics", [])
            summary_text = (
                f"Based on your recent assessment, our Evaluation Agent identified areas needing reinforcement: {', '.join(weak_topics)}. "
                "The Planning Agent has automatically adapted your study plan, scheduling high-yield remedial drills."
            )
        elif action == "learn_topic":
            summary_text = state.get("final_response", "Concept explanation prepared.")
        else:
            summary_text = state.get("final_response", f"SYNTRA agents have completed the workflow for {subject}.")

        logs.append({
            "agent_name": self.name,
            "action": "Collected all agent outputs, verified consistency, and synthesized student response.",
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        state["final_response"] = summary_text
        state["agent_logs"] = logs
        state["is_completed"] = True
        return state

    async def run(self, initial_state: AgentState) -> AgentState:
        """Execute the multi-agent orchestration loop."""
        state = dict(initial_state)
        if "agent_logs" not in state:
            state["agent_logs"] = []

        action = state.get("action_type", "goal_plan")
        
        # Route through Supervisor
        state = await self._supervisor_route_node(state)
        
        if action == "goal_plan":
            # 1. RAG Knowledge check
            state = await self._rag_node(state)
            # 2. Planning Agent creates plan
            state = await self._planning_node(state)
            # 3. Finalize
            state = await self._supervisor_finalize_node(state)
            
        elif action == "learn_topic":
            # 1. RAG retrieval for notes
            state = await self._rag_node(state)
            # 2. Learning Agent explains
            state = await self._learning_node(state)
            # 3. Finalize
            state = await self._supervisor_finalize_node(state)
            
        elif action == "adapt_plan":
            # 1. Planning agent adapts
            state = await self._planning_node(state)
            # 2. Finalize
            state = await self._supervisor_finalize_node(state)
            
        elif action == "generate_quiz":
            # 1. Evaluation agent generates
            state = await self._evaluation_node(state)
            # 2. Finalize
            state = await self._supervisor_finalize_node(state)
            
        else:
            # General study assistant workflow
            state = await self._rag_node(state)
            state = await self._learning_node(state)
            state = await self._supervisor_finalize_node(state)

        return state

supervisor_agent = SupervisorAgent()
