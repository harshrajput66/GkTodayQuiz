import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, quizAPI } from '../api';
import Navbar from '../components/Navbar';
import { Play, Trophy, Clock, TrendingUp, TrendingDown, Target, History, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTime(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/15',
    green: 'text-green-400 bg-green-500/10 border-green-500/15',
    red: 'text-red-400 bg-red-500/10 border-red-500/15',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/15',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/15',
  };
  const cls = colorMap[color] || colorMap.primary;

  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cls}`}>
        <Icon className="w-5 h-5" style={{ color: 'inherit' }} />
      </div>
      <div>
        <p className="text-2xl font-display font-700 text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([dashboardAPI.getAttempts(), dashboardAPI.getAnalytics()])
      .then(([attRes, anaRes]) => {
        setAttempts(attRes.data.data.attempts);
        setAnalytics(anaRes.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const startQuiz = async () => {
    setStarting(true);
    try {
      const res = await quizAPI.generate();
      const { attemptId } = res.data.data;
      navigate(`/quiz/${attemptId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setStarting(false);
    }
  };

  const recentAttempts = attempts.slice(0, 5);

  return (
    <div className="min-h-screen bg-animated">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-700 text-white">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400 mt-1">Ready for your next challenge?</p>
          </div>
          <button
            id="start-quiz-btn"
            onClick={startQuiz}
            disabled={starting}
            className="btn btn-primary text-base px-8 py-3.5 glow-primary"
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Start New Quiz
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse h-20 bg-surface-700/50" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Target} label="Total Attempts" value={analytics.totalAttempts} color="primary" />
            <StatCard icon={Trophy} label="Best Score" value={`${analytics.highestPercentage?.toFixed(1) || 0}%`} color="yellow" />
            <StatCard icon={TrendingUp} label="Average Score" value={`${analytics.averagePercentage?.toFixed(1) || 0}%`} color="green" />
            <StatCard
              icon={analytics.improvement >= 0 ? TrendingUp : TrendingDown}
              label="vs Last Attempt"
              value={`${analytics.improvement >= 0 ? '+' : ''}${analytics.improvement?.toFixed(1) || 0}%`}
              color={analytics.improvement >= 0 ? 'green' : 'red'}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent attempts table */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary-400" />
                  <h2 className="font-display font-600 text-white">Recent Attempts</h2>
                </div>
                <button onClick={() => navigate('/analytics')} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-surface-700/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentAttempts.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-500 mb-1">No quizzes yet</p>
                  <p className="text-slate-500 text-sm">Click "Start New Quiz" to begin!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAttempts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/review/${a.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`badge ${a.passed ? 'badge-pass' : 'badge-fail'}`}>
                          {a.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-600 text-white">
                            {parseFloat(a.percentage).toFixed(1)}% — {a.correctCount}/{a.totalQuestions}
                          </p>
                          <p className="text-xs text-slate-500">{new Date(a.startedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{formatTime(a.timeTaken)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats sidebar */}
          <div className="space-y-4">
            {/* Pass rate */}
            {analytics && analytics.totalAttempts > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-600 text-white mb-4 text-sm">Pass Rate</h3>
                <div className="relative flex items-center justify-center mb-3">
                  <svg width="100" height="100" className="rotate-[-90deg]">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(91,110,245,0.1)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(analytics.passRate / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                      style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-700 text-white">{analytics.passRate?.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">passed</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-400">
                  <div>
                    <p className="text-white font-600">{formatTime(analytics.bestTime)}</p>
                    <p>Best Time</p>
                  </div>
                  <div>
                    <p className="text-white font-600">{formatTime(analytics.averageTime)}</p>
                    <p>Avg Time</p>
                  </div>
                </div>
              </div>
            )}

            {/* Start card */}
            <div className="glass-card p-6 text-center bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/20">
              <Zap className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <h3 className="font-600 text-white mb-1">Quick Start</h3>
              <p className="text-xs text-slate-400 mb-4">30 random questions · 30 min timer</p>
              <button
                onClick={startQuiz}
                disabled={starting}
                className="btn btn-primary w-full text-sm"
              >
                <Play className="w-4 h-4" /> Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
