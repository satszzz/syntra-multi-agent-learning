import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Cpu, 
  Search, 
  FileText,
  Zap,
  Check,
  X,
  Network
} from 'lucide-react';
import { agentService } from '../services/api';
import { MindMapViewer } from '../components/MindMapViewer';

export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'Subnetting & Routing Principles';
  
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState('Computer Networks');
  const [loading, setLoading] = useState(false);
  const [lessonData, setLessonData] = useState(null);
  const [showMindMap, setShowMindMap] = useState(true);
  
  // Quick Check state
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    handleFetchLesson(initialTopic, 'explain');
  }, [initialTopic]);

  const handleFetchLesson = async (targetTopic, actionType = 'explain') => {
    setLoading(true);
    setSelectedOption(null);
    setShowExplanation(false);
    try {
      const res = await agentService.learnTopic({
        topic: targetTopic,
        subject: subject,
        action: actionType,
        current_level: 'Intermediate'
      });
      setLessonData(res.data);
      setTopic(targetTopic);
    } catch (err) {
      console.error("Learn topic failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckAnswer = (option) => {
    setSelectedOption(option);
    setShowExplanation(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Topic Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated AI Study Assistant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Learning: <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">{topic}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured conceptual instruction powered by Learning Agent and retrieved notes.
          </p>
        </div>

        {/* Custom Topic Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchLesson(topic, 'explain')}
            placeholder="Type any topic..."
            className="px-4 py-2 rounded-xl bg-dark-800 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-brand-primary w-56"
          />
          <button
            onClick={() => handleFetchLesson(topic, 'explain')}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explain</span>
          </button>
        </div>
      </div>

      {/* Action Chips */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => setShowMindMap(!showMindMap)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
            showMindMap 
              ? 'bg-gradient-to-r from-brand-primary/30 to-brand-accent/20 border-brand-primary text-cyan-200 shadow-md shadow-brand-primary/20' 
              : 'bg-dark-800 hover:bg-dark-700 border-white/10 text-slate-300'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>{showMindMap ? 'Hide Mind Map' : 'Interactive Mind Map'}</span>
        </button>
        <button
          onClick={() => handleFetchLesson(topic, 'explain')}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
          <span>Full Explanation</span>
        </button>
        <button
          onClick={() => handleFetchLesson(topic, 'simplify')}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Simplify / ELI5</span>
        </button>
        <button
          onClick={() => handleFetchLesson(topic, 'example')}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
        >
          <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
          <span>Give Real-World Example</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto animate-spin">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-200 text-lg">Learning Agent Synthesizing Lesson & Mind Map...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Retrieving notes from vector database and structuring pedagogical breakdown and cognitive schema.
          </p>
        </div>
      ) : lessonData ? (
        <div className="space-y-6">
          {/* Interactive Mind Map */}
          {showMindMap && (
            <MindMapViewer 
              mindMap={lessonData.mind_map} 
              topic={topic}
              onSelectTopic={(selectedNodeTopic) => handleFetchLesson(selectedNodeTopic, 'explain')}
            />
          )}
          {/* Conceptual Explanation Card */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                  AI
                </div>
                <h3 className="text-lg font-bold text-slate-100">Core Conceptual Breakdown</h3>
              </div>
              <span className="text-[10px] font-mono text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
                Learning Agent Output
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line font-light">
              {lessonData.explanation}
            </div>

            {/* Key Takeaways */}
            {lessonData.key_points && lessonData.key_points.length > 0 && (
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Principles to Remember</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lessonData.key_points.map((pt, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-dark-900/70 border border-white/5 flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        {i+1}
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real World Analogy Box */}
            {lessonData.real_world_example && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-primary/10 to-transparent border border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Real-World Mental Model / Analogy</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 font-light">
                  {lessonData.real_world_example}
                </p>
              </div>
            )}

            {/* Citations / RAG Note References */}
            {lessonData.citations && lessonData.citations.length > 0 && (
              <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 flex items-center gap-2 text-xs text-slate-400">
                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="font-semibold text-slate-300">Retrieved from your notes:</span>
                <span>{lessonData.citations.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Quick Check Practice Question */}
          {lessonData.practice_question && (
            <div className="glass-panel p-8 rounded-3xl border border-brand-accent/30 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs">
                    ?
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Interactive Concept Check</h3>
                    <p className="text-xs text-slate-400">Verify your understanding before moving forward</p>
                  </div>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-200">
                {lessonData.practice_question.question}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lessonData.practice_question.options?.map((opt, i) => {
                  const isCorrect = opt === lessonData.practice_question.correct_option;
                  const isSelected = selectedOption === opt;
                  
                  let optStyle = "bg-dark-900/80 border-white/10 hover:border-brand-primary/50 text-slate-300";
                  if (showExplanation) {
                    if (isCorrect) {
                      optStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold";
                    } else if (isSelected) {
                      optStyle = "bg-rose-500/20 border-rose-500/50 text-rose-200";
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleQuickCheckAnswer(opt)}
                      disabled={showExplanation}
                      className={`p-4 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {showExplanation && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                      {showExplanation && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1 animate-fade-in">
                  <p className="font-bold">✓ Explanation:</p>
                  <p>{lessonData.practice_question.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggested Next Steps */}
          {lessonData.suggested_next_topics && lessonData.suggested_next_topics.length > 0 && (
            <div className="p-6 rounded-3xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Recommended Next Topics</h4>
                <p className="text-xs text-slate-400">Continue along the Learning Agent curriculum path</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {lessonData.suggested_next_topics.map((nxt, i) => (
                  <button
                    key={i}
                    onClick={() => handleFetchLesson(nxt, 'explain')}
                    className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-brand-primary hover:text-white border border-white/10 text-xs font-medium text-slate-300 transition-all flex items-center gap-1"
                  >
                    <span>{nxt}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
