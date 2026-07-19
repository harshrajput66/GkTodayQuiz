import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page bg-animated flex-center" style={{ padding:'1.5rem' }}>
      {/* Orbs */}
      <div className="orb" style={{ width:400, height:400, background:'#5b6ef5', top:-120, left:-120 }} />
      <div className="orb" style={{ width:300, height:300, background:'#8b5cf6', bottom:-80, right:-80 }} />

      <div className="fade-in" style={{ width:'100%', maxWidth:440, position:'relative', zIndex:10 }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom:32 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:20 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:'linear-gradient(135deg,#5b6ef5,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Brain size={22} color="white" />
            </div>
            <span className="font-display fw-700 text-white text-xl">
              Quiz<span className="gradient-text">Pro</span>
            </span>
          </Link>
          <h1 className="font-display fw-700 text-white text-2xl" style={{ marginBottom:6 }}>Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to continue your learning journey</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:20 }}>
              <label className="text-sm fw-500 text-slate-300" style={{ display:'block', marginBottom:8 }}>Email</label>
              <div className="input-with-icon">
                <span className="input-icon-left"><Mail size={16} /></span>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field input-pl"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:28 }}>
              <label className="text-sm fw-500 text-slate-300" style={{ display:'block', marginBottom:8 }}>Password</label>
              <div className="input-with-icon">
                <span className="input-icon-left"><Lock size={16} /></span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field input-pl input-pr"
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-w-full"
              style={{ padding:'0.85rem', fontSize:'1rem' }}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="spinner spinner-sm" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#7b95fa', fontWeight:600, textDecoration:'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
