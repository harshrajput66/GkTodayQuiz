import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import ReviewCard from '../components/ReviewCard';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function Review() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'skipped'

  useEffect(() => {
    dashboardAPI.getReview(attemptId)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        toast.error('Failed to load review');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-animated">
        <div className="spinner mx-auto" />
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.questions.filter((q) => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'incorrect') return !q.isCorrect && q.selectedAnswer;
    if (filter === 'skipped') return !q.selectedAnswer;
    return true;
  });

  return (
    <div className="min-h-screen bg-animated">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h1 className="font-display text-2xl font-700 text-white mb-1">Quiz Review</h1>
          <p className="text-slate-400 text-sm mb-5">{new Date(data.submittedAt).toLocaleString()}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-primary-500/10 border border-primary-500/15">
              <Award className="w-4 h-4 text-primary-400 mx-auto mb-1" />
              <p className="text-lg font-700 text-white">{parseFloat(data.percentage).toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/15">
              <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-700 text-green-400">{data.correctCount}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/15">
              <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-700 text-red-400">{data.incorrectCount}</p>
              <p className="text-xs text-slate-500">Incorrect</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/15">
              <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-lg font-700 text-yellow-400">{formatTime(data.timeTaken)}</p>
              <p className="text-xs text-slate-500">Time</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all', label: `All (${data.questions.length})` },
            { key: 'correct', label: `Correct (${data.correctCount})` },
            { key: 'incorrect', label: `Wrong (${data.incorrectCount})` },
            { key: 'skipped', label: `Skipped (${data.skippedCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              id={`filter-${key}`}
              onClick={() => setFilter(key)}
              className={`btn text-sm py-2 ${filter === key ? 'btn-primary' : 'btn-ghost'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400">
              No questions match this filter.
            </div>
          ) : (
            filtered.map((q, idx) => (
              <ReviewCard key={q.questionId} q={q} index={data.questions.indexOf(q)} total={data.questions.length} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
