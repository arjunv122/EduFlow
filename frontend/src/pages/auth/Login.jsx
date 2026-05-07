import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogIn, Mail, Lock, Moon, Sun, ShieldCheck, Eye, EyeOff } from 'lucide-react';

/* ─────────────── Inline style objects ─────────────── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem',
  },
  blob1: {
    position: 'absolute', top: '-10%', left: '-10%',
    width: '40%', height: '40%', borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.08,
    filter: 'blur(80px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-10%', right: '-10%',
    width: '40%', height: '40%', borderRadius: '50%',
    background: '#4A90D9', opacity: 0.07,
    filter: 'blur(80px)', pointerEvents: 'none',
  },
  themeBtn: {
    position: 'absolute', top: '1.25rem', right: '1.25rem',
    padding: '0.6rem', borderRadius: '50%',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, transition: 'all 150ms ease',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '2.5rem',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    animation: 'fadeIn 0.25s ease-out',
  },
  logoWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', marginBottom: '2rem',
  },
  logoIcon: {
    width: 56, height: 56,
    background: 'var(--accent)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 4px 16px rgba(232,160,32,0.3)',
  },
  h1: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.6rem',
    fontWeight: 'normal',
    color: 'var(--text-primary)',
    margin: 0,
    textAlign: 'center',
  },
  sub: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
    textAlign: 'center',
  },
  fieldGroup: {
    display: 'flex', flexDirection: 'column',
    gap: '0.35rem', marginBottom: '1rem',
  },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: '0.75rem',
    top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)', pointerEvents: 'none',
    display: 'flex', alignItems: 'center',
  },
  inputEyeBtn: {
    position: 'absolute', right: '0.75rem',
    top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    color: 'var(--text-tertiary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '1.5rem 0',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationError, setActivationError] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActivationError(false);
    
    // Auto-append domain if they only typed their roll number
    let processedEmail = email.trim().toLowerCase();
    if (processedEmail && !processedEmail.includes('@')) {
      processedEmail += '@sret.edu.in';
    }

    try {
      await login(processedEmail, password);
    } catch (error) {
      if (error?.response?.data?.code === 'ACCOUNT_NOT_ACTIVATED') {
        setActivationError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activationError) {
    return (
      <div style={S.page}>
        <div style={S.blob1} />
        <div style={S.blob2} />
        <button style={S.themeBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ ...S.card, textAlign: 'center', maxWidth: 480 }}>
          <div style={{ ...S.logoIcon, margin: '0 auto 1.5rem auto', background: 'transparent', boxShadow: 'none' }}>
            <Lock size={48} color="var(--status-warning)" strokeWidth={1.5} />
          </div>
          <h1 style={{ ...S.h1, color: 'var(--status-warning)', marginBottom: '1.25rem' }}>Access Restricted</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2.5rem', fontWeight: 400 }}>
            You are not authorized to access the system at this time. Access credentials are only dispatched to registered and paid members. Please ensure your enrollment fees are settled or contact your institution's administrator to request account activation.
          </p>
          <button 
            onClick={() => setActivationError(false)}
            style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      {/* Theme toggle */}
      <button style={S.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>
            <ShieldCheck size={28} color="var(--text-inverse)" />
          </div>
          <h1 style={S.h1}>Welcome Back</h1>
          <p style={S.sub}>Sign in to your EduFlow account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={S.fieldGroup}>
            <label htmlFor="login-email">Roll No / Email Address</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}><Mail size={15} /></span>
              <input
                id="login-email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e0126001 or mail@sret.edu.in"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={S.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-pw">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Forgot password?</Link>
            </div>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}><Lock size={15} /></span>
              <input
                id="login-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
              />
              <button type="button" style={S.inputEyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>



          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-accent"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem', gap: '0.4rem' }}
          >
            {isSubmitting ? (
              <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <hr style={S.divider} />

        <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          New to EduFlow?{' '}
          <Link to="/register/student" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Student / Faculty Registration
          </Link>
          {' · '}
          <Link to="/register" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            Register Institution
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
