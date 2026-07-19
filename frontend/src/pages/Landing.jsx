import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Zap, FileText, BarChart2, Clock, Shield, RotateCcw } from 'lucide-react';

const features = [
  { icon: Zap,       title: 'Instant Quiz Generation',   desc: 'Get a fresh 30-question quiz in seconds, randomized from our GK question bank.' },
  { icon: FileText,  title: 'Detailed Explanations',     desc: 'After every quiz, review detailed explanations for each question you answered.' },
  { icon: BarChart2, title: 'Performance Analytics',     desc: 'Track your progress over time with beautiful charts and improvement metrics.' },
  { icon: Clock,     title: 'Timed Challenges',          desc: '30-minute countdown timer auto-submits your quiz, simulating real exam conditions.' },
  { icon: Shield,    title: 'Secure & Private',          desc: 'Your data is encrypted and protected. Login with JWT-secured authentication.' },
  { icon: RotateCcw, title: 'Review Past Attempts',      desc: 'Revisit any previous quiz with your selected answers, correct answers and explanations.' },
];

const stats = [
  { value: '30',   label: 'Questions Per Quiz' },
  { value: 'PDF',  label: 'Question Banks' },
  { value: '100%', label: 'Free to Use' },
  { value: '⚡',   label: 'Instant Score & Review' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page bg-animated">
      {/* Orb decorations */}
      <div className="orb" style={{ width:500, height:500, background:'#5b6ef5', top:-150, left:-150 }} />
      <div className="orb" style={{ width:400, height:400, background:'#8b5cf6', bottom:-100, right:-100 }} />

      {/* ── Navbar ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background:'rgba(15,17,23,0.85)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(91,110,245,0.15)',
      }}>
        <div className="container flex-between" style={{ height:64 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'linear-gradient(135deg,#5b6ef5,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Brain size={20} color="white" />
            </div>
            <span className="font-display fw-700 text-white text-xl">
              Quiz<span className="gradient-text">Pro</span>
            </span>
          </Link>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            {user ? (
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center" style={{ paddingTop:130, paddingBottom:80 }}>
        <div className="container">
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8, marginBottom:24,
            background:'rgba(91,110,245,0.1)', border:'1px solid rgba(91,110,245,0.25)',
            borderRadius:99, padding:'6px 16px',
          }}>
            <Zap size={14} color="#7b95fa" />
            <span className="text-primary-400 text-sm fw-500">Powered by AI-curated GK Questions</span>
          </div>

          <h1 className="font-display fw-800" style={{ fontSize:'clamp(2.2rem,5vw,4rem)', lineHeight:1.15, color:'#fff', marginBottom:20 }}>
            Ace Your Exams with<br />
            <span className="gradient-text">Smart Practice Quizzes</span>
          </h1>

          <p className="text-slate-400" style={{ fontSize:'1.1rem', maxWidth:520, margin:'0 auto 36px', lineHeight:1.7 }}>
            Randomized quizzes from expertly curated GK question banks. Practice, review explanations, track your progress, and improve every day.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:56 }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg glow-primary">
              Start Practicing Free →
            </Link>
            {!user && <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', justifyContent:'center', gap:'3rem', flexWrap:'wrap' }}>
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display fw-700 text-primary-400" style={{ fontSize:'1.8rem' }}>{s.value}</div>
                <div className="text-slate-500 text-xs" style={{ marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10" style={{ paddingBottom:96 }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom:48 }}>
            <h2 className="font-display fw-700 text-white text-3xl" style={{ marginBottom:10 }}>
              Everything you need to excel
            </h2>
            <p className="text-slate-400">A complete quiz platform built for serious learners</p>
          </div>

          <div className="grid-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 transition" style={{ cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(91,110,245,0.35)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.transform=''; }}
              >
                <div style={{
                  width:44, height:44, borderRadius:12, marginBottom:16,
                  background:'rgba(91,110,245,0.12)', border:'1px solid rgba(91,110,245,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon size={22} color="#7b95fa" />
                </div>
                <h3 className="fw-600 text-white" style={{ marginBottom:8 }}>{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10" style={{ paddingBottom:80 }}>
        <div className="container">
          <div className="glass-card text-center p-8" style={{
            background:'linear-gradient(135deg,rgba(91,110,245,0.15),rgba(139,92,246,0.1))',
            border:'1px solid rgba(91,110,245,0.25)',
          }}>
            <h2 className="font-display fw-700 text-white text-3xl" style={{ marginBottom:10 }}>
              Ready to test your knowledge?
            </h2>
            <p className="text-slate-400" style={{ marginBottom:28 }}>
              Join students who are already improving their scores every day.
            </p>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg glow-primary">
              {user ? 'Go to Dashboard →' : 'Get Started Free →'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'24px 0', textAlign:'center' }}>
        <p className="text-slate-500 text-sm">© 2026 QuizPro. All rights reserved.</p>
      </footer>
    </div>
  );
}
