import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  BookOpen, 
  CalendarDays, 
  Target, 
  CheckCircle2, 
  BrainCircuit, 
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const handleLaunchDemo = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 selection:bg-brand-primary selection:text-white">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary via-brand-secondary to-brand-accent p-0.5 shadow-lg shadow-brand-primary/30">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-primary">
            SYNTRA
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleLaunchDemo}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white text-sm font-semibold shadow-lg shadow-brand-primary/25 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Live Demo</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-xs font-semibold text-brand-accent mb-8 shadow-inner">
          <Zap className="w-3.5 h-3.5" />
          <span>AUTONOMOUS MULTI-AGENT LEARNING FRAMEWORK</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-none">
          Your Autonomous AI <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
            Learning Team.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Not just a simple chatbot. SYNTRA orchestrates specialized AI agents—Supervisor, RAG, Planning, Learning, and Evaluation—to understand your goals, ingest study notes, create tailored schedules, and continuously adapt your study plan.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleLaunchDemo}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white font-bold text-base shadow-xl shadow-brand-primary/30 hover:scale-105 transition-all flex items-center gap-3"
          >
            <span>Start Learning with Agents</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-2xl bg-dark-800 border border-white/10 hover:border-brand-primary/40 text-slate-200 font-semibold text-base transition-all"
          >
            Create Free Account
          </button>
        </div>

        {/* Multi-Agent Architecture Interactive Map */}
        <div className="mt-20 glass-panel rounded-3xl p-8 border border-white/10 text-left max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-brand-primary" />
                <span>Multi-Agent Orchestration Mesh</span>
              </h3>
              <p className="text-xs text-slate-400">Live LangGraph State Machine Execution Flow</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              5 Agents Synchronized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Agent 1 */}
            <div className="p-4 rounded-2xl bg-dark-900/90 border border-brand-primary/40 shadow-lg relative group">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center mb-3 text-brand-primary font-bold">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-200">Supervisor Agent</h4>
              <p className="text-xs text-slate-400 mt-1">Understands learning intent, breaks down requirements, and routes tasks.</p>
              <div className="mt-3 text-[10px] text-brand-primary font-mono bg-brand-primary/10 px-2 py-0.5 rounded">
                Router & Mesh Hub
              </div>
            </div>

            {/* Agent 2 */}
            <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/10 hover:border-cyan-400/40 transition-colors shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3 text-cyan-400 font-bold">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-200">RAG Agent</h4>
              <p className="text-xs text-slate-400 mt-1">Parses PDFs, extracts chunks, and performs semantic vector retrieval.</p>
              <div className="mt-3 text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                ChromaDB + PyMuPDF
              </div>
            </div>

            {/* Agent 3 */}
            <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/10 hover:border-purple-400/40 transition-colors shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 text-purple-400 font-bold">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-200">Planning Agent</h4>
              <p className="text-xs text-slate-400 mt-1">Generates customized day-by-day study roadmap prioritizing weak topics.</p>
              <div className="mt-3 text-[10px] text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded">
                Adaptive Scheduler
              </div>
            </div>

            {/* Agent 4 */}
            <div className="p-4 rounded-2xl bg-dark-900/90 border border-white/10 hover:border-indigo-400/40 transition-colors shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400 font-bold">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-200">Learning Agent</h4>
              <p className="text-xs text-slate-400 mt-1">Delivers pedagogical explanations, real-world analogies, and quick checks.</p>
              <div className="mt-3 text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                Conceptual Tutor
              </div>
            </div>

            {/* Agent 5 */}
            <div className="p-4 rounded-2xl bg-dark-900/90 border border-emerald-500/30 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400 font-bold">
                5
              </div>
              <h4 className="font-bold text-sm text-slate-200">Evaluation Agent</h4>
              <p className="text-xs text-slate-400 mt-1">Generates MCQs, calculates mastery, and triggers adaptive plan rebalancing.</p>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                Diagnostic & Feedback
              </div>
            </div>
          </div>

          {/* Adaptive Loop Indicator */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand-primary/10 via-purple-500/10 to-emerald-500/10 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-brand-primary animate-spin" />
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">The Adaptive Closed Loop:</span>
                <span className="text-xs text-slate-400 ml-2">Learn → Evaluate → Detect Weak Areas → Mutate Study Plan → Learn Again</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-accent">100% Autonomous</span>
          </div>
        </div>
      </section>
    </div>
  );
};
