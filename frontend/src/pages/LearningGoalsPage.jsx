import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Sparkles, 
  Calendar, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Plus, 
  X, 
  Cpu, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { goalService } from '../services/api';

export const LearningGoalsPage = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('Computer Networks');
  const [goalDescription, setGoalDescription] = useState('Prepare for my semester exam in 7 days. I need mastery in Subnetting and Routing.');
  
  // Set default exam date 7 days in future
  const defaultExam = new Date();
  defaultExam.setDate(defaultExam.getDate() + 7);
  const [examDate, setExamDate] = useState(defaultExam.toISOString().split('T')[0]);
  
  const [studentLevel, setStudentLevel] = useState('Intermediate');
  const [dailyHours, setDailyHours] = useState(2.0);
  const [weakTopics, setWeakTopics] = useState(['Subnetting', 'Routing']);
  const [newWeakTopic, setNewWeakTopic] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [agentOrchestrationStep, setAgentOrchestrationStep] = useState(null);
  const [error, setError] = useState(null);

  const handleAddWeakTopic = (e) => {
    e.preventDefault();
    if (newWeakTopic.trim() && !weakTopics.includes(newWeakTopic.trim())) {
      setWeakTopics([...weakTopics, newWeakTopic.trim()]);
      setNewWeakTopic('');
    }
  };

  const handleRemoveWeakTopic = (topicToRemove) => {
    setWeakTopics(weakTopics.filter(t => t !== topicToRemove));
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setAgentOrchestrationStep("Supervisor Agent understanding requirements & routing...");
      await new Promise(r => setTimeout(r, 600));

      setAgentOrchestrationStep("RAG Agent checking uploaded notes & curriculum index...");
      await new Promise(r => setTimeout(r, 600));

      setAgentOrchestrationStep("Planning Agent generating personalized multi-day schedule...");
      
      const payload = {
        subject,
        goal_description: goalDescription,
        exam_date: examDate,
        student_level: studentLevel,
        weak_topics: weakTopics,
        daily_study_hours: parseFloat(dailyHours),
        include_rag: true
      };

      const res = await goalService.createGoal(payload);
      
      setAgentOrchestrationStep("Evaluation Agent calibrating diagnostic benchmarks...");
      await new Promise(r => setTimeout(r, 500));

      navigate('/study-plan');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to initialize learning plan.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
          <Target className="w-3.5 h-3.5" />
          <span>Goal & Strategy Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Define Your Learning Goal
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tell SYNTRA what you are preparing for. The Supervisor Agent will orchestrate all specialized agents to construct your adaptive curriculum.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Modal / Multi-Agent Dispatch Visualizer */}
      {loading && (
        <div className="glass-panel p-8 rounded-3xl border border-brand-primary/40 shadow-2xl space-y-4 animate-fade-in bg-dark-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary animate-spin">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Supervisor Multi-Agent Coordination</h4>
              <p className="text-xs text-brand-accent font-mono mt-0.5">{agentOrchestrationStep}</p>
            </div>
          </div>
          <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent h-2 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSubmitGoal} className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Subject / Exam</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Networks, DBMS, Operating Systems"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Target Exam Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Goal Description</label>
            <textarea
              rows={3}
              required
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="Describe what you want to achieve or specific concepts to prioritize..."
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Current Knowledge Level</label>
              <select
                value={studentLevel}
                onChange={(e) => setStudentLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="Beginner">Beginner (Foundations & Basics)</option>
                <option value="Intermediate">Intermediate (Core Concepts & Practice)</option>
                <option value="Advanced">Advanced (Exam Drills & Problem Solving)</option>
              </select>
            </div>

            {/* Daily Study Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Daily Study Time: <span className="text-brand-accent font-mono font-bold">{dailyHours} hours/day</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>30 mins</span>
                <span>4 hours</span>
                <span>8 hours</span>
              </div>
            </div>
          </div>

          {/* Weak Topics Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Known Weak Areas <span className="text-slate-500 font-normal">(Planning Agent will allocate higher weight)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {weakTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2"
                >
                  <span>{topic}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWeakTopic(topic)}
                    className="hover:text-rose-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newWeakTopic}
                onChange={(e) => setNewWeakTopic(e.target.value)}
                placeholder="Add topic (e.g. Subnetting, Bellman-Ford, OSPF)..."
                className="flex-1 px-4 py-2 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-brand-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWeakTopic(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddWeakTopic}
                className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-white font-bold text-sm shadow-xl shadow-brand-primary/30 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create My Personalized Learning Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
