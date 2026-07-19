import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import Navbar from '../components/Navbar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Award, Target, Clock, CheckCircle, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

function formatTime(s) {
  if (!s) return '—';
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm border border-primary-500/20">
      <p className="text-slate-400 mb-1">Attempt {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-600">
          {p.value?.toFixed(1)}{p.dataKey === 'percentage' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.getAnalytics(), dashboardAPI.getAttempts()])
      .then(([anaRes, attRes]) => {
        setAnalytics(anaRes.data.data);
        setAttempts(attRes.data.data.attempts);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-animated">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="min-h-screen bg-animated">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 text-center">
          <BarChart2 className="w-16 h-16 text-slate-600 mx-auto mb-4 mt-12" />
          <h2 className="font-display text-2xl font-700 text-white mb-2">No data yet</h2>
          <p className="text-slate-400 mb-6">Complete your first quiz to see analytics here.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const trendData = analytics.trend.map((t) => ({
    ...t,
    date: new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  }));

  const scoreDistribution = [
    { label: '0–40%', count: attempts.filter((a) => a.percentage < 40).length, color: '#ef4444' },
    { label: '40–60%', count: attempts.filter((a) => a.percentage >= 40 && a.percentage < 60).length, color: '#f59e0b' },
    { label: '60–80%', count: attempts.filter((a) => a.percentage >= 60 && a.percentage < 80).length, color: '#3b82f6' },
    { label: '80–100%', count: attempts.filter((a) => a.percentage >= 80).length, color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen bg-animated">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-700 text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Your performance at a glance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: 'Best Score', value: `${analytics.highestPercentage?.toFixed(1)}%`, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/15' },
            { icon: Target, label: 'Avg Score', value: `${analytics.averagePercentage?.toFixed(1)}%`, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/15' },
            { icon: Clock, label: 'Best Time', value: formatTime(analytics.bestTime), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/15' },
            { icon: CheckCircle, label: 'Pass Rate', value: `${analytics.passRate?.toFixed(0)}%`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/15' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`stat-card border ${bg}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-white/5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Performance Trend (Area Chart) */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              <h2 className="font-600 text-white text-sm">Score Trend</h2>
              <span className={`ml-auto flex items-center gap-1 text-xs font-600 ${analytics.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.improvement >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {analytics.improvement >= 0 ? '+' : ''}{analytics.improvement?.toFixed(1)}% vs prev
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b6ef5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5b6ef5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="attempt" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#5b6ef5"
                  strokeWidth={2.5}
                  fill="url(#scoreGrad)"
                  dot={{ fill: '#5b6ef5', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#7b95fa' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="glass-card p-6">
            <h2 className="font-600 text-white text-sm mb-5">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#161b27', border: '1px solid rgba(91,110,245,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full Attempt History */}
        <div className="glass-card p-6">
          <h2 className="font-display font-600 text-white mb-5">All Attempts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Date</th>
                  <th className="text-left pb-3 pr-4">Score</th>
                  <th className="text-left pb-3 pr-4">Correct</th>
                  <th className="text-left pb-3 pr-4">Time</th>
                  <th className="text-left pb-3 pr-4">Status</th>
                  <th className="text-left pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attempts.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-white/3 transition-colors group">
                    <td className="py-3 pr-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 pr-4 text-slate-300">{new Date(a.startedAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-700 ${
                        a.percentage >= 80 ? 'text-green-400' : a.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {parseFloat(a.percentage).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{a.correctCount}/{a.totalQuestions}</td>
                    <td className="py-3 pr-4 text-slate-400">{formatTime(a.timeTaken)}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${a.passed ? 'badge-pass' : 'badge-fail'}`}>
                        {a.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/review/${a.id}`)}
                        className="text-xs text-primary-400 hover:text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
