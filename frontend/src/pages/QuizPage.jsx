import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../api';
import { useTimer } from '../hooks/useTimer';
import ScoreCard from '../components/ScoreCard';
import { ChevronLeft, ChevronRight, Flag, Clock, CheckSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMER_SECONDS = 10 * 60; // 10 minutes

export default function QuizPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: selectedKey }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Refs to access latest state in event listeners
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const questionsRef = useRef([]);

  const handleExpire = useCallback(() => {
    if (!submittedRef.current) {
      toast('⏰ Time is up! Submitting your quiz...', { icon: '⏰' });
      handleSubmit(true);
    }
  }, []);

  const { formatted, percentage: timerPct, isUrgent, start } = useTimer(TIMER_SECONDS, handleExpire);

  useEffect(() => {
    quizAPI.getQuestions(attemptId)
      .then((res) => {
        const data = res.data.data;
        setQuestions(data.questions);
        questionsRef.current = data.questions;
        start(data.remainingSeconds);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load quiz');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  const handleSelect = (questionId, optionKey) => {
    if (submitted) return;
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: optionKey };
      answersRef.current = newAnswers;
      return newAnswers;
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);

    const currentQuestions = questionsRef.current.length ? questionsRef.current : questions;
    const currentAnswers = Object.keys(answersRef.current).length ? answersRef.current : answers;

    const payload = currentQuestions.map((q) => ({
      questionId: q.questionId,
      selectedAnswer: currentAnswers[q.questionId] || null,
    }));

    try {
      const res = await quizAPI.submit(attemptId, payload);
      setResult(res.data.data);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Security & Anti-Cheat Measures ──
  useEffect(() => {
    if (submitted || loading) return;

    // 1. Prevent accidental reload/close
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
    };

    // 2. Trap the back button
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
      toast.error('You cannot go back during an active quiz!', { id: 'back-warn' });
    };

    // 3. Detect tab switching (Anti-cheat)
    const handleVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        toast.error('Tab switching detected! Please stay on this page.', {
          icon: '⚠️',
          duration: 4000,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [submitted, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-animated">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-400">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-animated py-12 px-4">
        <ScoreCard result={result} />
      </div>
    );
  }

  const current = questions[currentIdx];
  const totalAnswered = Object.keys(answers).length;
  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-animated">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Question progress */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-slate-400 font-500 whitespace-nowrap">
              Q{currentIdx + 1} / {questions.length}
            </span>
            <div className="progress-bar flex-1">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            isUrgent ? 'bg-red-500/15 border border-red-500/30' : 'bg-surface-700/60 border border-white/5'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400 timer-ring' : 'text-primary-400'}`} />
            <span className={`text-sm font-700 font-mono ${isUrgent ? 'timer-urgent' : 'text-white'}`}>
              {formatted}
            </span>
          </div>

          {/* Answered count */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
            <CheckSquare className="w-3.5 h-3.5 text-primary-400" />
            {totalAnswered}/{questions.length}
          </div>

          {/* Exit Quiz */}
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to end the quiz? Your score will be calculated based on your current answers.")) {
                handleSubmit(false);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">End Quiz</span>
          </button>
        </div>
      </div>

      {/* Main question area */}
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-32">
        {current && (
          <div className="slide-in" key={currentIdx}>
            {/* Question */}
            <div className="glass-card p-6 sm:p-8 mb-5">
              <div className="flex items-start gap-3 mb-6">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-700">
                  {currentIdx + 1}
                </span>
                <p className="text-white text-lg leading-relaxed font-500">{current.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(current.options).map(([key, value]) => {
                  const isSelected = answers[current.questionId] === key;
                  return (
                    <button
                      key={key}
                      id={`option-${key}`}
                      onClick={() => handleSelect(current.questionId, key)}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-700 flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-700/60 text-slate-400'
                      }`}>
                        {key}
                      </span>
                      <span className={`text-sm flex-1 text-left leading-relaxed ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}>
                        {value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question grid */}
            <div className="glass-card p-4 mb-5">
              <p className="text-xs text-slate-500 mb-3 font-500">Question Navigator</p>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answers[q.questionId];
                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-700 transition-all ${
                        idx === currentIdx
                          ? 'bg-primary-500 text-white scale-110'
                          : ans
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            id="prev-btn"
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            id="submit-quiz-btn"
            onClick={() => {
              if (totalAnswered < questions.length) {
                const unanswered = questions.length - totalAnswered;
                if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
              }
              handleSubmit(false);
            }}
            disabled={submitting}
            className="btn btn-danger px-6"
          >
            <Flag className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>

          <button
            id="next-btn"
            onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
            disabled={currentIdx === questions.length - 1}
            className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
