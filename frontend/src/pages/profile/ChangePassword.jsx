import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2 } from 'lucide-react';

const S = {
  card: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '2rem', maxWidth: 480, margin: '2rem auto'
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
  inputLeftPadding: { paddingLeft: '2.25rem' },
};

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }

    setIsSubmitting(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title serif-heading">Security</h1>
          <p className="page-subtitle">Update your account password</p>
        </div>
      </div>

      <div style={S.card}>
        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={S.fieldGroup}>
            <label>Current Password</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}><Lock size={15} /></span>
              <input
                type="password" required value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••" style={S.inputLeftPadding}
              />
            </div>
          </div>
          
          <hr style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', margin: '1.5rem 0' }} />

          {/* New Password */}
          <div style={S.fieldGroup}>
            <label>New Password</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}><Lock size={15} /></span>
              <input
                type="password" required value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" style={S.inputLeftPadding} minLength={8}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Minimum 8 characters</span>
          </div>

          {/* Confirm New Password */}
          <div style={S.fieldGroup}>
            <label>Confirm New Password</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}><Lock size={15} /></span>
              <input
                type="password" required value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" style={S.inputLeftPadding} minLength={8}
              />
            </div>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="btn btn-accent"
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {isSubmitting ? (
              <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
            ) : (
              <><CheckCircle2 size={16} /> Update Password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
