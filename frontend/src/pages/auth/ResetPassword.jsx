import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import { Lock, ArrowLeft, Sun, Moon, ShieldCheck, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '1rem' },
  blob1: { position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'var(--accent)', opacity: 0.08, filter: 'blur(80px)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: '#4A90D9', opacity: 0.07, filter: 'blur(80px)', pointerEvents: 'none' },
  themeBtn: { position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.6rem', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  card: { width: '100%', maxWidth: 420, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '2.5rem', position: 'relative', zIndex: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', animation: 'fadeIn 0.25s ease-out' },
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setIsSubmitting(true);
    setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />
      <button style={S.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div style={S.card}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--status-present)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle2 size={28} color="white" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Password Reset!</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your password has been updated. Redirecting you to login…
            </p>
            <Link to="/login" className="btn btn-accent" style={{ display: 'inline-flex', gap: '0.4rem' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 16px rgba(232,160,32,0.3)' }}>
                <ShieldCheck size={28} color="var(--text-inverse)" />
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>Set New Password</h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: 'center' }}>
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <label htmlFor="new-pw">New Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex' }}>
                    <Lock size={15} />
                  </span>
                  <input
                    id="new-pw"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <label htmlFor="confirm-pw">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'flex' }}>
                    <Lock size={15} />
                  </span>
                  <input
                    id="confirm-pw"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                  />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: '0.8rem', color: 'var(--status-absent)', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'var(--status-absent-bg)', borderRadius: 6, border: '1px solid rgba(234,67,53,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-accent"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem', gap: '0.4rem' }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', textDecoration: 'none' }}>
                <ArrowLeft size={13} /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
