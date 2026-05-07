import { useState, useEffect } from 'react';
import { getDepartmentLeaves, processStudentLeave } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { Shield, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

const HODLeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [filter, setFilter] = useState('pending');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await getDepartmentLeaves(filter === 'all' ? null : filter);
      setLeaves(r.data?.data || r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleProcess = async (id, status) => {
    setProcessing(id);
    try {
      await processStudentLeave(id, status, remarks[id] || '');
      toast.success(`Leave ${status}`);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--status-warning-bg)', border: '1px solid rgba(232,160,32,0.3)', display: 'flex' }}>
            <Shield size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Leave Approvals</h1>
            <p className="page-subtitle">Review and approve student leave requests</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : leaves.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No {filter !== 'all' ? filter : ''} leave requests.
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaves.map(leave => (
            <div key={leave._id} className="card lift" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{leave.student?.name || 'Student'}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>{leave.student?.email}</p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                  background: leave.status === 'approved' ? 'var(--status-present-bg)' : leave.status === 'rejected' ? 'var(--status-absent-bg)' : 'var(--status-warning-bg)',
                  color: leave.status === 'approved' ? 'var(--status-present)' : leave.status === 'rejected' ? 'var(--status-absent)' : 'var(--accent)',
                }}>
                  {leave.status === 'approved' ? <CheckCircle2 size={12} /> : leave.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                  {leave.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                <div><span style={{ color: 'var(--text-tertiary)' }}>From:</span> <strong>{new Date(leave.startDate).toLocaleDateString()}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>To:</span> <strong>{new Date(leave.endDate).toLocaleDateString()}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Days:</span> <strong>{leave.totalDays}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Type:</span> <strong style={{ textTransform: 'capitalize' }}>{leave.leaveType}</strong></div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}><strong>Reason:</strong> {leave.reason}</p>

              {leave.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    value={remarks[leave._id] || ''}
                    onChange={e => setRemarks(r => ({ ...r, [leave._id]: e.target.value }))}
                    style={{ flex: 1, minWidth: 200, padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                  />
                  <button onClick={() => handleProcess(leave._id, 'approved')} className="btn btn-accent" disabled={processing === leave._id} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button onClick={() => handleProcess(leave._id, 'rejected')} className="btn btn-secondary" disabled={processing === leave._id} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem', color: 'var(--status-absent)' }}>
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HODLeaveApproval;
