import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Layers, 
  FileText, 
  CalendarDays, 
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { agentActivityService } from '../services/api';

export const AgentActivityPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const res = await agentActivityService.getActivity();
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load agent activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAgentBadgeColor = (name) => {
    if (name.includes("Supervisor")) return "bg-brand-primary/20 text-brand-primary border-brand-primary/30";
    if (name.includes("RAG") || name.includes("Knowledge")) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    if (name.includes("Planning")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (name.includes("Learning")) return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    if (name.includes("Evaluation")) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    return "bg-slate-700 text-slate-300 border-slate-600";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Transparency & State Machine Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Multi-Agent Activity Stream
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time trace of decisions and actions taken by the Supervisor, Planning, RAG, Learning, and Evaluation agents.
          </p>
        </div>

        <button
          onClick={fetchActivity}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Logs</span>
        </button>
      </div>

      {/* 5 Agents Overview Mesh Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { name: "Supervisor", role: "Routing & Mesh Hub", icon: Layers, color: "text-brand-primary" },
          { name: "RAG Agent", role: "Vector Retrieval", icon: FileText, color: "text-cyan-400" },
          { name: "Planning Agent", role: "Adaptive Roadmaps", icon: CalendarDays, color: "text-purple-400" },
          { name: "Learning Agent", role: "Concept Explainer", icon: Sparkles, color: "text-indigo-400" },
          { name: "Evaluation Agent", role: "Diagnostic Scoring", icon: HelpCircle, color: "text-emerald-400" },
        ].map((ag, i) => {
          const Icon = ag.icon;
          return (
            <div key={i} className="p-3.5 rounded-2xl glass-panel border border-white/5 text-center">
              <Icon className={`w-5 h-5 ${ag.color} mx-auto mb-1.5`} />
              <h4 className="font-bold text-xs text-slate-200">{ag.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{ag.role}</p>
            </div>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {sessions.map((session, sIdx) => (
          <div key={session.id || sIdx} className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-200 uppercase font-mono">
                  {session.action_type?.replace(/_/g, ' ')}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {session.timestamp ? new Date(session.timestamp).toLocaleTimeString() : 'Recent'}
              </span>
            </div>

            {/* Supervisor Decision Pill */}
            {session.supervisor_decision && (
              <div className="p-3.5 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-slate-200 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-brand-primary">Supervisor Orchestration:</span>
                  <span className="ml-1 text-slate-300 font-light">{session.supervisor_decision}</span>
                </div>
              </div>
            )}

            {/* Step by Step Agent Logs */}
            <div className="space-y-2.5 pl-2 border-l-2 border-white/10 ml-2">
              {session.agent_steps?.map((step, stepIdx) => (
                <div key={stepIdx} className="relative pl-4 space-y-1">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-500" />
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getAgentBadgeColor(step.agent_name)}`}>
                      {step.agent_name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      ✓ {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-light pl-0.5">{step.action}</p>
                  {step.details && (
                    <p className="text-[11px] text-slate-400 italic pl-0.5 font-mono">{step.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
