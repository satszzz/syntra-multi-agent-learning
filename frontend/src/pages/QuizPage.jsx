import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Award, 
  BookOpen, 
  CalendarDays,
  Clock,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { quizService } from '../services/api';

export const QuizPage = () => {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { question_id: selected_index }
  
  // Results state
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    handleGenerateQuiz();
  }, []);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setResult(null);
    setUserAnswers({});
    setCurrentIndex(0);
    try {
      const res = await quizService.generateQuiz({ subject: 'Computer Networks' });
      setQuiz(res.data);
    } catch (err) {
      console.error("Quiz generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setEvaluating(true);

    try {
      const formattedAnswers = quiz.questions.map(q => ({
        question_id: q.id,
        selected_option_index: userAnswers[q.id] ?? -1
      }));

      const res = await quizService.submitQuiz({
        quiz_id: quiz.id,
        answers: formattedAnswers
      });
      setResult(res.data);

      if (res.data.score_percentage >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const currentQuestion = quiz?.questions?.[currentIndex];
  const totalQuestions = quiz?.questions?.length || 0;
  const isAnswered = currentQuestion && userAnswers[currentQuestion.id] !== undefined;
  const allAnswered = quiz?.questions?.every(q => userAnswers[q.id] !== undefined);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Autonomous Evaluation Agent</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Diagnostic & Topic Assessment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Questions calibrated by Evaluation Agent. Performance triggers closed-loop plan adaptation.
          </p>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={loading || evaluating}
          className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-white/10 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>New Diagnostic Quiz</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-200 text-lg">Evaluation Agent Generating Questions...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Constructing diagnostic questions targeting Subnetting, Routing, and OSI model mastery.
          </p>
        </div>
      ) : result ? (
        /* Evaluation Results Screen */
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8 animate-fade-in">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Evaluation Completed
              </span>
              <h2 className="text-2xl font-bold text-slate-100 mt-2">
                Diagnostic Score: {result.correct_count} / {result.total_questions} ({result.score_percentage}%)
              </h2>
              <p className="text-xs text-slate-400 mt-1">{result.ai_feedback}</p>
            </div>

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent p-1 flex-shrink-0 flex items-center justify-center shadow-xl shadow-brand-primary/30">
              <div className="w-full h-full bg-dark-900 rounded-full flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white font-mono">{result.score_percentage}%</span>
                <span className="text-[9px] text-slate-400 font-mono">ACCURACY</span>
              </div>
            </div>
          </div>

          {/* Adaptive Trigger Banner */}
          {result.study_plan_adapted && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-brand-primary/15 to-transparent border border-purple-500/30 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-purple-200">
                  Closed-Loop Adaptation Triggered by Supervisor
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Weak topics detected ({result.identified_weak_topics.join(', ')}). The Planning Agent has updated your study plan, inserting dedicated problem-solving drills into your upcoming schedule.
                </p>
                <button
                  onClick={() => navigate('/study-plan')}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>View Adapted Study Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* Topic Performance Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Topic-Wise Diagnostics Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.topic_breakdown?.map((tb, i) => (
                <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">{tb.topic}</h5>
                    <p className="text-xs text-slate-400">
                      {tb.correct_questions}/{tb.total_questions} correct ({tb.accuracy_percentage}%)
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    tb.status === 'Strong' 
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
                      : tb.status === 'Weak'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                  }`}>
                    {tb.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Explanations Review */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Detailed Question Explanations
            </h4>
            <div className="space-y-4">
              {quiz.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correct_answer_index;
                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-dark-900/60 border border-white/5 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-200 text-sm">
                        {idx + 1}. {q.question}
                      </p>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      <span className="text-slate-500">Correct Answer:</span> <span className="font-semibold text-emerald-400">{q.options[q.correct_answer_index]}</span>
                    </p>
                    <p className="text-slate-400 bg-dark-800/80 p-3 rounded-xl border border-white/5">
                      💡 <span className="font-semibold text-slate-300">Explanation:</span> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              onClick={handleGenerateQuiz}
              className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-lg transition-all"
            >
              Take Another Diagnostic Quiz
            </button>
          </div>
        </div>
      ) : (
        /* Active Quiz Interface */
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">
          {/* Stepper Progress */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-brand-primary font-bold">
                QUESTION {currentIndex + 1} OF {totalQuestions}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{currentQuestion?.topic}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 capitalize bg-dark-900 px-2 py-1 rounded">
              Difficulty: {currentQuestion?.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div>
            <h3 className="text-lg font-bold text-slate-100 leading-relaxed">
              {currentQuestion?.question}
            </h3>
          </div>

          {/* MCQ Options */}
          <div className="space-y-3">
            {currentQuestion?.options?.map((option, optIdx) => {
              const isSelected = userAnswers[currentQuestion.id] === optIdx;
              const optionLetters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-brand-primary/20 border-brand-primary text-white shadow-lg shadow-brand-primary/10'
                      : 'bg-dark-900/80 border-white/10 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isSelected ? 'bg-brand-primary text-white' : 'bg-dark-800 text-slate-400'
                  }`}>
                    {optionLetters[optIdx]}
                  </span>
                  <span className="flex-1 font-light leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={evaluating}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{evaluating ? 'Evaluation Agent Grading...' : 'Submit & Evaluate'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
