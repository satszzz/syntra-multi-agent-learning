import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { analyticsService } from '../services/api';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsService.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Performance & Mastery Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Learning Telemetry & Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed metrics generated from your multi-agent interactions, quizzes, and study sessions.
        </p>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-xs text-slate-400">Curriculum Mastery</p>
          <p className="text-3xl font-extrabold text-white mt-2 font-mono">
            {data?.overall_progress ?? 45}%
          </p>
          <div className="w-full bg-dark-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-brand-primary h-1.5 rounded-full" 
              style={{ width: `${data?.overall_progress ?? 45}%` }} 
            />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-xs text-slate-400">Quiz Average</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono flex items-center gap-2">
            <Award className="w-6 h-6" /> {data?.average_quiz_score ?? 73.5}%
          </p>
          <p className="text-[10px] text-slate-500 mt-2">{data?.quizzes_taken ?? 2} diagnostic assessments taken</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-xs text-slate-400">Total Study Time</p>
          <p className="text-3xl font-extrabold text-brand-accent mt-2 font-mono flex items-center gap-2">
            <Clock className="w-6 h-6" /> {Math.round((data?.total_study_minutes ?? 240) / 60)} <span className="text-sm font-sans font-normal text-slate-400">hours</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-2">Paced to exam deadline</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-xs text-slate-400">Adaptation Loop</p>
          <p className="text-sm font-bold text-purple-300 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{data?.is_plan_adapted ? "Active" : "Synchronized"}</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-2">Agent mesh rebalances in real-time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Progression Over Time */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <span>Diagnostic Score Progression</span>
            </h3>
            <p className="text-xs text-slate-400">Historical quiz performance curve</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.score_trend || [
                { quiz_number: 'Q1', score: 60 },
                { quiz_number: 'Q2', score: 75 },
                { quiz_number: 'Q3', score: 85 }
              ]}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2738" vertical={false} />
                <XAxis dataKey="quiz_number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D111A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Study Activity */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Weekly Study Hours</span>
            </h3>
            <p className="text-xs text-slate-400">Daily time invested in curriculum topics</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_activity || [
                { day: 'Mon', hours: 2.0 },
                { day: 'Tue', hours: 2.5 },
                { day: 'Wed', hours: 1.5 },
                { day: 'Thu', hours: 3.0 },
                { day: 'Fri', hours: 2.0 },
                { day: 'Sat', hours: 3.5 },
                { day: 'Sun', hours: 2.5 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2738" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D111A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
