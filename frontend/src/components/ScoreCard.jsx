import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Award, RefreshCw, BookOpen, ChevronRight } from 'lucide-react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function ScoreCard({ result }) {
  const navigate = useNavigate();
  const { attemptId, score, totalQuestions, correctCount, incorrectCount, skippedCount, percentage, timeTaken, passed, submittedAt } = result;

  const pct = parseFloat(percentage).toFixed(1);

  const getScoreColor = () => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = () => {
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good Job!';
    if (percentage >= 40) return 'Keep Practicing';
    return 'Needs Improvement';
  };

  const circumference = 2 * Math.PI * 52;
  const strokeDash = (percentage / 100) * circumference;

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/20 mb-3">
          <Award className="w-6 h-6 text-primary-400" />
        </div>
        <h2 className="text-2xl font-display font-700 text-white mb-1">Quiz Complete!</h2>
        <p className="text-slate-400 text-sm">{new Date(submittedAt).toLocaleString()}</p>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg width="140" height="140" className="rotate-[-90deg]">
            <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(91,110,245,0.1)" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="52"
              fill="none"
              stroke={getScoreColor()}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${getScoreColor()})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-800 text-white">{pct}%</span>
            <span className="text-xs text-slate-400 font-medium mt-0.5">{score}/{totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Pass/Fail */}
      <div className="text-center mb-6">
        <span className={`badge text-sm px-4 py-1.5 ${passed ? 'badge-pass' : 'badge-fail'}`}>
          {passed ? '✓ PASSED' : '✗ FAILED'}
        </span>
        <p className="text-slate-300 font-600 mt-2">{getScoreLabel()}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Correct</p>
            <p className="text-xl font-700 text-green-400">{correctCount}</p>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Incorrect</p>
            <p className="text-xl font-700 text-red-400">{incorrectCount}</p>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Time Taken</p>
            <p className="text-lg font-700 text-yellow-400">{formatTime(timeTaken)}</p>
          </div>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 flex-shrink-0 text-slate-400 text-center font-bold text-sm">—</div>
          <div>
            <p className="text-xs text-slate-400">Skipped</p>
            <p className="text-xl font-700 text-slate-300">{skippedCount}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          id="review-answers-btn"
          onClick={() => navigate(`/review/${attemptId}`)}
          className="btn btn-primary flex-1"
        >
          <BookOpen className="w-4 h-4" />
          Review Answers
        </button>
        <button
          id="start-new-quiz-btn"
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary flex-1"
        >
          <RefreshCw className="w-4 h-4" />
          New Quiz
        </button>
      </div>
    </div>
  );
}
