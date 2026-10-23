import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  CalendarDays, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  ChevronRight,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalService, studyPlanService, analyticsService } from '../services/api';

export const DashboardPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeGoal, setActiveGoal] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [goalRes, planRes, analRes] = await Promise.all([
          goalService.getActiveGoal().catch(() => ({ data: null })),
          studyPlanService.getPlan().catch(() => ({ data: null })),
          analyticsService.getAnalytics().catch(() => ({ data: null }))
        ]);
        setActiveGoal(goalRes.data);
        setStudyPlan(planRes.data);
        setAnalytics(analRes.data);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const handleToggleTopic = async (topicId) => {
    try {
      const res = await studyPlanService.toggleTopicStatus(topicId);
      // Refresh plan
      const planRes = await studyPlanService.getPlan();
      setStudyPlan(planRes.data);
      const analRes = await analyticsService.getAnalytics();
      setAnalytics(analRes.data);
    } catch (err) {
      console.error("Toggle topic failed:", err);
    }
  };

  const todaySchedule = studyPlan?.schedule?.find(d => d.day_number === 1) || studyPlan?.schedule?.[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border border-white/10 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-60 h-60 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent System Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Welcome back, {user?.name || 'Satheeswaran'}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl font-light leading-relaxed">
              SYNTRA's supervisor has coordinated your study plan for <span className="font-semibold text-slate-200">{activeGoal?.subject || 'Computer Networks'}</span>. 
              {studyPlan?.is_adapted ? " Your schedule was recently adapted to drill weak areas." : " Follow today's milestone to stay on track."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/tutor')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-sm font-semibold shadow-lg shadow-brand-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Learning</span>
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="px-5 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 border border-white/10 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Take Quiz</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-white/5">
            <p className="text-xs text-slate-400">Exam Countdown</p>
            <p className="text-2xl font-bold text-brand-accent mt-1 flex items-center gap-1.5 font-mono">
              <Clock className="w-5 h-5" /> {activeGoal?.days_remaining ?? 7} <span className="text-xs text-slate-400 font-sans font-normal">days left</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/60 border border-white/5">
            <p className="text-xs text-slate-400">Curriculum Progress</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">
              {analytics?.overall_progress ?? 45}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/60 border border-white/5">
            <p className="text-xs text-slate-400">Average Quiz Score</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono flex items-center gap-1.5">
              <Award className="w-5 h-5" /> {analytics?.average_quiz_score ?? 73.5}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/60 border border-white/5">
            <p className="text-xs text-slate-400">Study Plan Status</p>
            <p className="text-xs font-semibold text-purple-300 mt-2 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {studyPlan?.is_adapted ? "Adaptively Rebalanced" : "Active & Optimized"}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Tasks & Weak vs Strong Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule Column */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-brand-primary" />
                  <span>Today's Learning Milestones</span>
                </h3>
                <p className="text-xs text-slate-400">{todaySchedule?.title || 'Day 1: Core Foundations'}</p>
              </div>
              <button
                onClick={() => navigate('/study-plan')}
                className="text-xs text-brand-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>View Full Roadmap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {todaySchedule?.topics?.map((topic) => (
                <div
                  key={topic.topic_id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    topic.is_completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                      : 'bg-dark-900/80 border-white/5 hover:border-brand-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTopic(topic.topic_id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        topic.is_completed 
                          ? 'bg-emerald-500 text-white' 
                          : 'border border-slate-600 hover:border-brand-primary'
                      }`}
                    >
                      {topic.is_completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${topic.is_completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {topic.name}
                        </span>
                        {topic.is_weak_area && (
                          <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded font-mono font-medium border border-rose-500/20">
                            Weak Area
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ⏱ {topic.estimated_minutes} mins • Difficulty: {topic.difficulty}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/tutor?topic=${encodeURIComponent(topic.name)}`)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-primary hover:text-white text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <span>Learn</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-brand-primary" />
              <span className="text-xs text-slate-300">
                Supervisor Agent monitors completion and recalculates daily review priorities.
              </span>
            </div>
          </div>
        </div>

        {/* Weak vs Strong Knowledge Profile */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-brand-secondary" />
              <span>Topic Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">Identified by SYNTRA Evaluation Agent</p>

            {/* Weak Topics */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Needs Reinforcement (Weak)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(analytics?.weak_topics || ['Subnetting', 'Routing']).map((wt, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/tutor?topic=${encodeURIComponent(wt)}`)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-medium hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span>{wt}</span>
                    <ArrowRight className="w-3 h-3 text-rose-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Strong Topics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Strong Mastery (Passed)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(analytics?.strong_topics || ['OSI Model', 'TCP/IP']).map((st, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                  >
                    ✓ {st}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5">
            <button
              onClick={() => navigate('/quiz')}
              className="w-full py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Test Knowledge via Diagnostic Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Chart Teaser */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Curriculum Mastery by Topic</span>
            </h3>
            <p className="text-xs text-slate-400">Live accuracy telemetry across subjects</p>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs text-brand-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span>Detailed Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.topic_mastery || [
              { topic: 'OSI Model', mastery: 92 },
              { topic: 'TCP/IP', mastery: 88 },
              { topic: 'IP Addressing', mastery: 78 },
              { topic: 'Subnetting', mastery: 52 },
              { topic: 'Routing', mastery: 58 },
              { topic: 'Transport', mastery: 84 },
            ]}>
              <XAxis dataKey="topic" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D111A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#6366F1' }}
              />
              <Bar dataKey="mastery" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
