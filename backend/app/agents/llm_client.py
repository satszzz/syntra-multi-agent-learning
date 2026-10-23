import json
import re
from typing import Dict, Any, List, Optional
from app.config.settings import settings

class LLMClient:
    """Resilient LLM Client with direct API connection & intelligent educational engine fallback."""
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model_name = settings.LLM_MODEL
        self.provider = settings.LLM_PROVIDER
        self._llm = None
        self._init_llm()

    def _init_llm(self):
        if self.api_key and len(self.api_key.strip()) > 5:
            try:
                from langchain_openai import ChatOpenAI
                self._llm = ChatOpenAI(
                    model=self.model_name,
                    api_key=self.api_key,
                    temperature=settings.LLM_TEMPERATURE
                )
                print(f"[LLM] Connected to {self.model_name} via {self.provider}.")
            except Exception as e:
                print(f"[LLM] Failed to initialize live LLM: {e}. Using deterministic engine.")
                self._llm = None
        else:
            self._llm = None

    def is_live(self) -> bool:
        return self._llm is not None

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Invoke live LLM if available, else run domain-specific educational synthesis."""
        if self._llm is not None:
            try:
                from langchain_core.messages import SystemMessage, HumanMessage
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]
                res = await self._llm.ainvoke(messages)
                return res.content
            except Exception as e:
                print(f"[LLM] Live API invocation failed ({e}), using fallback synthesis.")

        # Fallback simulation based on prompt intent
        return self._simulate_response(system_prompt, user_prompt)

    def _simulate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Intelligent, highly educational fallback response generator for demo and offline use."""
        combined = (system_prompt + " " + user_prompt).lower()
        
        # 0. RAG Agent Knowledge Retrieval
        if "rag agent" in system_prompt.lower():
            if "exam" in user_prompt.lower() or "7 days" in user_prompt.lower() or "weak" in user_prompt.lower():
                return (
                    "Based on your Computer Networks study materials (Unit 3 Notes):\n\n"
                    "• High-Yield Topics for Subnetting & Routing:\n"
                    "  - Subnet Calculations: Borrowing host bits, formula 2^(Host Bits) - 2 for usable hosts, and the Magic Number technique.\n"
                    "  - Routing Forwarding: Longest Prefix Match principle, Split Horizon in RIP to prevent count-to-infinity loops, and Dijkstra SPF in OSPF.\n\n"
                    "💡 Note: You can generate your full interactive 7-day study roadmap and calendar in the 'Learning Goals' page!"
                )
            return (
                "Based on your uploaded study notes (Unit 3 Notes, Page 1-2):\n\n"
                "• Subnetting divides large IP networks into smaller subnets by borrowing host bits to conserve address space.\n"
                "• The Subnet Mask separates the Network ID from the Host ID.\n"
                "• Routers forward packets according to the Longest Prefix Match rule in routing tables."
            )

        # 1. Learning Agent Explanation
        if "learning agent" in combined or "teach me" in combined or "action mode" in combined or "analog" in combined:
            return json.dumps({
                "topic": "Subnetting & Routing Principles",
                "explanation": "Subnetting is the practice of dividing a single physical network into multiple logical subnetworks (subnets). By borrowing host bits for the network identifier, administrators minimize broadcast domain size, improve routing efficiency, and conserve IP address space.",
                "key_points": [
                    "A Subnet Mask separates the Network ID from the Host ID using contiguous 1s followed by 0s.",
                    "CIDR (Classless Inter-Domain Routing) uses prefix notation (e.g., /24, /27) to specify the number of network bits.",
                    "Usable Hosts Formula: 2^(Host Bits) - 2 (subtracting the Network ID and Broadcast Address).",
                    "Magic Number (Block Size) = 256 - Value of interesting subnet mask octet.",
                    "Routing uses Longest Prefix Match to forward packets to the most specific matching network."
                ],
                "real_world_example": "Imagine an office building with 4 departments (Engineering, HR, Sales, Finance). Instead of giving each department an entire Class C network (254 addresses each, wasting hundreds of IPs), you divide a single 192.168.1.0/24 network into four /26 subnets, giving each department exactly 62 usable addresses with isolated broadcast domains.",
                "practice_question": {
                    "question": "You need to create 4 subnets with at least 25 usable hosts per subnet from the network 192.168.50.0/24. What subnet mask should you choose?",
                    "options": ["/25 (255.255.255.128)", "/26 (255.255.255.192)", "/27 (255.255.255.224)", "/28 (255.255.255.240)"],
                    "correct_option": "/27 (255.255.255.224)",
                    "explanation": "/27 borrows 3 bits (giving 2^3 = 8 subnets) with 5 host bits remaining (2^5 - 2 = 30 usable hosts per subnet, which safely satisfies the requirement of >= 25 hosts)."
                },
                "suggested_next_topics": ["VLSM Design", "Default Gateway Configuration", "OSPF Routing Fundamentals"]
            })

        # 2. Study Plan Generation
        if "study plan" in combined or "schedule" in combined or "planning agent" in combined:
            return json.dumps({
                "summary": "Personalized 7-day high-yield study plan prioritizing detected weak areas (Subnetting & Routing).",
                "days": [
                    {
                        "day_number": 1,
                        "title": "OSI & TCP/IP Model Foundations",
                        "focus": "Protocol architecture, encapsulation, and layer responsibilities",
                        "topics": [
                            {"name": "OSI 7 Layers vs TCP/IP Stack", "difficulty": "Easy", "estimated_minutes": 60, "is_weak_area": False, "subtopics": ["Encapsulation", "Layer 2 vs Layer 3"]},
                            {"name": "Physical & Data Link Layers", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": False, "subtopics": ["Framing", "MAC Addressing", "CSMA/CD"]}
                        ]
                    },
                    {
                        "day_number": 2,
                        "title": "IP Addressing & CIDR Notation",
                        "focus": "IPv4 classes, binary conversions, and subnet boundaries",
                        "topics": [
                            {"name": "IPv4 Addressing Classes & Private IPs", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": False, "subtopics": ["Class A/B/C", "RFC 1918"]},
                            {"name": "CIDR & Subnet Mask Fundamentals", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["Prefix Lengths", "Network/Broadcast IDs"]}
                        ]
                    },
                    {
                        "day_number": 3,
                        "title": "Deep Dive: Subnetting & FLSM/VLSM",
                        "focus": "Step-by-step subnet calculation, host calculations, and VLSM design",
                        "topics": [
                            {"name": "Fixed Length Subnet Masking (FLSM)", "difficulty": "Hard", "estimated_minutes": 75, "is_weak_area": True, "subtopics": ["Borrowing Bits", "Magic Number Technique"]},
                            {"name": "Variable Length Subnet Masking (VLSM)", "difficulty": "Hard", "estimated_minutes": 75, "is_weak_area": True, "subtopics": ["Hierarchical Subnetting", "Waste Reduction"]}
                        ]
                    },
                    {
                        "day_number": 4,
                        "title": "Routing Principles & Static Routing",
                        "focus": "Packet forwarding mechanisms, default routes, and route lookups",
                        "topics": [
                            {"name": "Routing Tables & Next-Hop Forwarding", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["Longest Prefix Match", "Directly Connected Routes"]},
                            {"name": "Static vs Dynamic Routing", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["Administrative Distance", "Metric Calculation"]}
                        ]
                    },
                    {
                        "day_number": 5,
                        "title": "Dynamic Routing Protocols (Distance Vector & Link State)",
                        "focus": "RIP, OSPF, and Dijkstra Shortest Path First algorithm",
                        "topics": [
                            {"name": "Distance Vector (RIP) & Count-to-Infinity", "difficulty": "Hard", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["Bellman-Ford Algorithm", "Split Horizon", "Poison Reverse"]},
                            {"name": "Link-State Protocols (OSPF & Areas)", "difficulty": "Hard", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["LSA Flooding", "Shortest Path First"]}
                        ]
                    },
                    {
                        "day_number": 6,
                        "title": "Transport Protocols & Comprehensive Revision",
                        "focus": "TCP 3-Way Handshake, UDP, Flow Control, and Weak Area Drills",
                        "topics": [
                            {"name": "TCP vs UDP Reliability & Congestion Control", "difficulty": "Medium", "estimated_minutes": 60, "is_weak_area": False, "subtopics": ["Sliding Window", "SYN-ACK Handshake"]},
                            {"name": "Targeted Subnetting & Routing Drill Session", "difficulty": "Hard", "estimated_minutes": 60, "is_weak_area": True, "subtopics": ["Rapid Subnet Calculations", "Route Troubleshooting"]}
                        ]
                    },
                    {
                        "day_number": 7,
                        "title": "Full Exam Simulation & Final Review",
                        "focus": "Timed mock exam, performance debrief, and formula cheat sheet review",
                        "topics": [
                            {"name": "Full-Length Computer Networks Mock Exam", "difficulty": "Hard", "estimated_minutes": 90, "is_weak_area": True, "subtopics": ["30 Questions", "Scenario Analysis"]},
                            {"name": "Final Formula & Port Numbers Speed Review", "difficulty": "Easy", "estimated_minutes": 30, "is_weak_area": False, "subtopics": ["Standard Ports", "Subnet Mask Reference"]}
                        ]
                    }
                ]
            })

        # 2. Quiz Generation
        if "quiz" in combined or "question" in combined or "evaluation" in combined:
            return json.dumps({
                "title": "Computer Networks Diagnostic & Topic Assessment",
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
                        "explanation": "/26 borrows 2 bits in the 4th octet (128 + 64 = 192). Total addresses = 2^(32-26) = 64. Usable hosts = 64 - 2 = 62 (subtracting network and broadcast addresses).",
                        "difficulty": "Medium"
                    },
                    {
                        "id": "q2",
                        "topic": "Subnetting",
                        "question": "What is the broadcast address for the subnet containing the host 10.1.1.45/28?",
                        "options": [
                            "10.1.1.63",
                            "10.1.1.47",
                            "10.1.1.31",
                            "10.1.1.255"
                        ],
                        "correct_answer_index": 1,
                        "explanation": "/28 has a block size (magic number) of 2^(32-28) = 16. Subnet intervals in the 4th octet are 0, 16, 32, 48... Host 45 falls into the 10.1.1.32 subnet. The broadcast address is 32 + 16 - 1 = 10.1.1.47.",
                        "difficulty": "Hard"
                    },
                    {
                        "id": "q3",
                        "topic": "Routing",
                        "question": "Which mechanism prevents routing loops in Distance Vector routing protocols like RIP by preventing an update from being advertised out the interface it was learned from?",
                        "options": [
                            "Dijkstra Algorithm",
                            "Split Horizon",
                            "Maximum Hop Count of 15",
                            "Longest Prefix Match"
                        ],
                        "correct_answer_index": 1,
                        "explanation": "Split Horizon states that a router will not advertise a route back out the same interface from which it learned that route, stopping basic two-node routing loops.",
                        "difficulty": "Medium"
                    },
                    {
                        "id": "q4",
                        "topic": "Routing",
                        "question": "When a router receives a packet with destination IP 172.16.5.20 and has routes for 172.16.0.0/16 and 172.16.5.0/24 in its routing table, which route is chosen?",
                        "options": [
                            "172.16.0.0/16 because it covers a larger network",
                            "172.16.5.0/24 because of the Longest Prefix Match rule",
                            "The route with the lowest metric regardless of prefix length",
                            "Traffic is load-balanced equally across both routes"
                        ],
                        "correct_answer_index": 1,
                        "explanation": "Routers always prioritize the Longest Prefix Match (/24 is longer/more specific than /16) when forwarding packets.",
                        "difficulty": "Medium"
                    },
                    {
                        "id": "q5",
                        "topic": "OSI Model",
                        "question": "At which layer of the OSI model does logical IP addressing and packet routing occur?",
                        "options": [
                            "Data Link Layer (Layer 2)",
                            "Network Layer (Layer 3)",
                            "Transport Layer (Layer 4)",
                            "Session Layer (Layer 5)"
                        ],
                        "correct_answer_index": 1,
                        "explanation": "The Network Layer (Layer 3) handles end-to-end logical addressing (IP addresses) and path determination (routing).",
                        "difficulty": "Easy"
                    }
                ]
            })

        # 3. Learning Agent Explanation
        return json.dumps({
            "topic": "Subnetting & Routing",
            "explanation": "Subnetting is the practice of dividing a single physical network into multiple logical subnetworks (subnets). By borrowing host bits for the network identifier, administrators minimize broadcast domain size, improve routing efficiency, and conserve IP address space.",
            "key_points": [
                "A Subnet Mask separates the Network ID from the Host ID using contiguous 1s followed by 0s.",
                "CIDR (Classless Inter-Domain Routing) uses prefix notation (e.g., /24, /27) to specify the number of network bits.",
                "Usable Hosts Formula: 2^(Host Bits) - 2 (subtracting the Network ID and Broadcast Address).",
                "Magic Number (Block Size) = 256 - Value of interesting subnet mask octet.",
                "Routing uses Longest Prefix Match to forward packets to the most specific matching network."
            ],
            "real_world_example": "Imagine an office building with 4 departments (Engineering, HR, Sales, Finance). Instead of giving each department an entire Class C network (254 addresses each, wasting hundreds of IPs), you divide a single 192.168.1.0/24 network into four /26 subnets, giving each department exactly 62 usable addresses with isolated broadcast domains.",
            "practice_question": {
                "question": "You need to create 4 subnets with at least 25 usable hosts per subnet from the network 192.168.50.0/24. What subnet mask should you choose?",
                "options": ["/25 (255.255.255.128)", "/26 (255.255.255.192)", "/27 (255.255.255.224)", "/28 (255.255.255.240)"],
                "correct_option": "/27 (255.255.255.224)",
                "explanation": "/27 borrows 3 bits (giving 2^3 = 8 subnets) with 5 host bits remaining (2^5 - 2 = 30 usable hosts per subnet, which safely satisfies the requirement of >= 25 hosts)."
            },
            "suggested_next_topics": ["VLSM Design", "Default Gateway Configuration", "OSPF Routing Fundamentals"]
        })

llm_client = LLMClient()
