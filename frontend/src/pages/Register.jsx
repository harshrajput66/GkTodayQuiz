import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function StrengthBar({ password }) {
  const len = password.length;
  const score = len === 0 ? 0 : len < 6 ? 1 : len < 8 ? 2 : len < 12 ? 3 : 4;
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:2,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)',
            transition:'background 0.2s',
          }} />
        ))}
      </div>
      {score > 0 && <p className="text-xs" style={{ marginTop:4, color: colors[score] }}>{labels[score]}</p>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to QuizPro 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page bg-animated flex-center" style={{ padding:'1.5rem' }}>
      <div className="orb" style={{ width:420, height:420, background:'#5b6ef5', top:-120, right:-120 }} />
      <div className="orb" style={{ width:320, height:320, background:'#8b5cf6', bottom:-80, left:-80 }} />

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
          <h1 className="font-display fw-700 text-white text-2xl" style={{ marginBottom:6 }}>Create your account</h1>
          <p className="text-slate-400 text-sm">Start your learning journey today</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom:18 }}>
              <label className="text-sm fw-500 text-slate-300" style={{ display:'block', marginBottom:8 }}>Full Name</label>
              <div className="input-with-icon">
                <span className="input-icon-left"><User size={16} /></span>
                <input id="reg-name" type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field input-pl" placeholder="Your Name" required autoComplete="name" />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom:18 }}>
              <label className="text-sm fw-500 text-slate-300" style={{ display:'block', marginBottom:8 }}>Email</label>
              <div className="input-with-icon">
                <span className="input-icon-left"><Mail size={16} /></span>
                <input id="reg-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field input-pl" placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:28 }}>
              <label className="text-sm fw-500 text-slate-300" style={{ display:'block', marginBottom:8 }}>Password</label>
              <div className="input-with-icon">
                <span className="input-icon-left"><Lock size={16} /></span>
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field input-pl input-pr" placeholder="Min. 6 characters" required autoComplete="new-password" />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && <StrengthBar password={form.password} />}
            </div>

            <button id="reg-submit-btn" type="submit" disabled={loading}
              className="btn btn-primary btn-w-full"
              style={{ padding:'0.85rem', fontSize:'1rem' }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="spinner spinner-sm" />
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#7b95fa', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
