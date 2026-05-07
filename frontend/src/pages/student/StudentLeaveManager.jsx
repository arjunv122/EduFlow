import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applyStudentLeave, getMyLeaves } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle2, Clock, XCircle, Loader2, Send } from 'lucide-react';

// Check if date is a Sunday
const isSunday = (d) => new Date(d).getDay() === 0;
// Check if date is 2nd Saturday of its month
const isSecondSaturday = (d) => {
  const date = new Date(d);
  if (date.getDay() !== 6) return false;
  const day = date.getDate();
  return day >= 8 && day <= 14;
};

const StudentLeaveManager = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    startDate: '', endDate: '', reason: '', leaveType: 'personal',
  });
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    getMyLeaves()
      .then(r => setLeaves(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Validate dates on change
  useEffect(() => {
    if (!form.startDate || !form.endDate) { setDateError(''); return; }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const blocked = [];
    const current = new Date(start);
    while (current <= end) {
      if (isSunday(current)) blocked.push(`${current.toLocaleDateString()} (Sunday)`);
      if (isSecondSaturday(current)) blocked.push(`${current.toLocaleDateString()} (2nd Saturday)`);
      current.setDate(current.getDate() + 1);
    }
    setDateError(blocked.length > 0 ? `Blocked dates in range: ${blocked.join(', ')}` : '');
  }, [form.startDate, form.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dateError) return toast.error('Fix blocked dates before submitting');
    if (!form.reason.trim()) return toast.error('Reason is required');
    setSubmitting(true);
    try {
      await applyStudentLeave(form);
      toast.success('Leave request submitted!');
      setForm({ startDate: '', endDate: '', reason: '', leaveType: 'personal' });
      const r = await getMyLeaves();
      setLeaves(r.data?.data || r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (s) => {
    if (s === 'approved') return <CheckCircle2 size={14} color="var(--status-present)" />;
    if (s === 'rejected') return <XCircle size={14} color="var(--status-absent)" />;
    return <Clock size={14} color="var(--accent)" />;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <Calendar size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">My Leaves</h1>
            <p className="page-subtitle">Apply for leave and track your requests</p>
          </div>
        </div>
      </div>

      {/* Apply Leave Form */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>Start Date</label>
            <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>End Date</label>
            <input type="date" required value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} min={form.startDate || new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>Leave Type</label>
            <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
              <option value="personal">Personal</option>
              <option value="medical">Medical</option>
              <option value="family">Family</option>
              <option value="academic">Academic</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>Reason</label>
            <textarea rows={3} required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Briefly explain the reason…" style={{ width: '100%', resize: 'vertical' }} />
          </div>

          {dateError && (
            <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.75rem', background: 'var(--status-absent-bg)', border: '1px solid rgba(234,67,53,0.2)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--status-absent)' }}>
              ⚠ {dateError}
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-accent" disabled={submitting || !!dateError} style={{ gap: '0.4rem' }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Submitting…' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Leave History */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Leave History</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No leave requests yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td>{l.totalDays}</td>
                    <td><span className="badge badge-neutral" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{l.leaveType}</span></td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', color: l.status === 'approved' ? 'var(--status-present)' : l.status === 'rejected' ? 'var(--status-absent)' : 'var(--accent)' }}>
                        {statusIcon(l.status)} {l.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{l.reviewedBy?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{l.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLeaveManager;
