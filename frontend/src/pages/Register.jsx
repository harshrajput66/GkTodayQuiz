import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Password strength bar ──────────────────────────── */
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

/* ── Mask email for display ─────────────────────────── */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

/* ── OTP digit input component ──────────────────────── */
function OtpInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);

  const handleChange = (idx, e) => {
    const val = e.target.value;
    if (val && !/^\d$/.test(val)) return; // only digits
    const newOtp = value.split('');
    newOtp[idx] = val;
    const joined = newOtp.join('');
    onChange(joined);
    // Auto-advance
    if (val && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, ' ').slice(0, length).replace(/ /g, ''));
    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          style={{
            width: 48, height: 56,
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: "'Courier New', monospace",
            color: '#7b95fa',
            background: 'rgba(91,110,245,0.08)',
            border: '2px solid rgba(91,110,245,0.25)',
            borderRadius: 12,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            caretColor: '#7b95fa',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#5b6ef5';
            e.target.style.boxShadow = '0 0 0 3px rgba(91,110,245,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(91,110,245,0.25)';
            e.target.style.boxShadow = 'none';
          }}
        />
      ))}
    </div>
  );
}

/* ── Main Register Component ────────────────────────── */
export default function Register() {
  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Step 1 state
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2 state (OTP)
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Cooldown timer
  const startCooldown = useCallback((seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  /* ── Step 1: Submit form → send OTP ───────────────── */
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await sendOtp(form.name, form.email, form.password);
      toast.success('Verification code sent! Check your email 📧');
      setStep(2);
      setOtp('');
      startCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ───────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) { toast.error('Please enter the full 6-digit code'); return; }
    setVerifying(true);
    try {
      await verifyOtp(form.email, otp);
      toast.success('Account verified! Welcome to QuizPro 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  /* ── Resend OTP ───────────────────────────────────── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp(form.email);
      toast.success('New code sent!');
      setOtp('');
      startCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  /* ── Auto-submit when 6 digits entered ────────────── */
  useEffect(() => {
    if (otp.length === 6 && step === 2 && !verifying) {
      handleVerifyOtp();
    }
  }, [otp]);

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
          <h1 className="font-display fw-700 text-white text-2xl" style={{ marginBottom:6 }}>
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1
              ? 'Start your learning journey today'
              : <>We sent a code to <strong style={{ color:'#7b95fa' }}>{maskEmail(form.email)}</strong></>
            }
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {step === 1 ? (
            /* ─────────── STEP 1: Registration Form ─────────── */
            <form onSubmit={handleSubmitForm}>
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
                    className="input-field input-pl" placeholder="you@gmail.com" required autoComplete="email" />
                </div>
                <p className="text-xs text-slate-500" style={{ marginTop:6 }}>
                  Gmail, Outlook, Yahoo, iCloud, and ProtonMail accepted
                </p>
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
                    Sending verification code...
                  </span>
                ) : 'Continue →'}
              </button>
            </form>
          ) : (
            /* ─────────── STEP 2: OTP Verification ─────────── */
            <form onSubmit={handleVerifyOtp}>
              {/* Shield icon */}
              <div className="text-center" style={{ marginBottom:24 }}>
                <div style={{
                  width:56, height:56, borderRadius:16,
                  background:'linear-gradient(135deg, rgba(91,110,245,0.15), rgba(139,92,246,0.15))',
                  border:'1px solid rgba(91,110,245,0.2)',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  marginBottom:8,
                }}>
                  <ShieldCheck size={28} color="#7b95fa" />
                </div>
              </div>

              {/* OTP input */}
              <div style={{ marginBottom:24 }}>
                <OtpInput length={6} value={otp} onChange={setOtp} />
              </div>

              {/* Verify button */}
              <button id="verify-otp-btn" type="submit" disabled={verifying || otp.length < 6}
                className="btn btn-primary btn-w-full"
                style={{ padding:'0.85rem', fontSize:'1rem', marginBottom:16 }}>
                {verifying ? (
                  <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="spinner spinner-sm" />
                    Verifying...
                  </span>
                ) : 'Verify & Create Account'}
              </button>

              {/* Resend + Back */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <button type="button" onClick={() => { setStep(1); setOtp(''); }}
                  className="text-sm fw-500"
                  style={{
                    background:'none', border:'none', color:'#94a3b8', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:4,
                    padding:0,
                  }}>
                  <ArrowLeft size={14} /> Back
                </button>

                <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                  className="text-sm fw-500"
                  style={{
                    background:'none', border:'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    color: resendCooldown > 0 ? '#475569' : '#7b95fa',
                    display:'flex', alignItems:'center', gap:4,
                    padding:0,
                    transition: 'color 0.2s',
                  }}>
                  <RotateCcw size={14} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

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
