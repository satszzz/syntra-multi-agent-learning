import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  BookOpen, 
  Award,
  Layers,
  Check
} from 'lucide-react';
import { studyPlanService, analyticsService } from '../services/api';

export const StudyPlanPage = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await studyPlanService.getPlan();
      setPlan(res.data);
    } catch (err) {
      console.error("Failed to load study plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (topicId) => {
    try {
      const res = await studyPlanService.toggleTopicStatus(topicId);
      // Update local state smoothly
      if (plan && plan.schedule) {
        const updatedSchedule = plan.schedule.map(day => {
          let dayCompleted = true;
          const updatedTopics = day.topics.map(t => {
            if (t.topic_id === topicId) {
              const updatedStatus = !t.is_completed;
              if (!updatedStatus) dayCompleted = false;
              return { ...t, is_completed: updatedStatus };
            }
            if (!t.is_completed) dayCompleted = false;
            return t;
          });
          return { ...day, topics: updatedTopics, is_completed: dayCompleted };
        });
        setPlan({ ...plan, schedule: updatedSchedule });
      }
    } catch (err) {
      console.error("Toggle topic failed:", err);
    }
  };

  const handleTriggerRebalance = async () => {
    setRebalancing(true);
    try {
      const res = await studyPlanService.triggerAdaptation();
      setPlan(res.data);
      setToast("Supervisor Agent & Planning Agent have successfully re-balanced your curriculum based on your diagnostics!");
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error("Adaptive rebalance error:", err);
    } finally {
      setRebalancing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Autonomous Curriculum Schedule</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {plan?.subject || 'Computer Networks'} Study Plan
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Day-by-day roadmap personalized by the Planning Agent based on your weak areas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerRebalance}
            disabled={rebalancing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 hover:border-brand-primary border border-brand-primary/40 text-slate-100 text-xs font-semibold transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${rebalancing ? 'animate-spin' : ''}`} />
            <span>{rebalancing ? 'Planning Agent Rebalancing...' : 'Trigger Adaptive Rebalance'}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Adaptive Status Tag */}
      {plan?.is_adapted && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-brand-primary/10 to-transparent border border-purple-500/30 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-purple-200">Adaptive Rebalance Active (Version {plan.version})</h4>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">ADAPTED BY AGENTS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {plan.adaptation_reason || "Curriculum was automatically restructured to reinforce identified weak topics."}
            </p>
          </div>
        </div>
      )}

      {/* Days Schedule Timeline */}
      <div className="space-y-6">
        {plan?.schedule?.map((day) => (
          <div 
            key={day.day_number}
            className={`glass-panel rounded-3xl p-6 border transition-all ${
              day.is_completed 
                ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                : 'border-white/10 hover:border-brand-primary/30'
            }`}
          >
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/5 gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                  day.is_completed 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                }`}>
                  D{day.day_number}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{day.title}</h3>
                  <p className="text-xs text-slate-400">{day.focus}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {day.is_revision && (
                  <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    REVISION DAY
                  </span>
                )}
                {day.is_mock_test && (
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    FINAL MOCK EXAM
                  </span>
                )}
                <span className="text-xs font-mono text-slate-500">{day.date}</span>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-3">
              {day.topics?.map((topic) => (
                <div
                  key={topic.topic_id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    topic.is_completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-dark-900/60 border-white/5 hover:border-brand-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTopic(topic.topic_id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                        topic.is_completed 
                          ? 'bg-emerald-500 text-white' 
                          : 'border border-slate-600 hover:border-brand-primary'
                      }`}
                    >
                      {topic.is_completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${topic.is_completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {topic.name}
                        </span>
                        {topic.is_weak_area && (
                          <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded font-mono font-medium border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Priority Weak Area
                          </span>
                        )}
                      </div>

                      {topic.notes && (
                        <p className="text-xs text-brand-primary/90 mt-1 italic">
                          💡 {topic.notes}
                        </p>
                      )}

                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {topic.subtopics.map((st, s_idx) => (
                            <span key={s_idx} className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right text-xs text-slate-400 hidden sm:block">
                      <p className="font-mono">{topic.estimated_minutes} mins</p>
                      <p className="text-[10px] text-slate-500 capitalize">{topic.difficulty} difficulty</p>
                    </div>

                    <button
                      onClick={() => navigate(`/tutor?topic=${encodeURIComponent(topic.name)}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Learn with AI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
