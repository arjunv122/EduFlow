import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDepartmentLeaves, processStudentLeave } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { Shield, CheckCircle2, XCircle, Clock, Loader2, FileText, Stethoscope, AlertTriangle, ExternalLink } from 'lucide-react';

const statusStyle = (s) => ({
  approved: { color: 'var(--status-present)', bg: 'var(--status-present-bg)' },
  rejected: { color: 'var(--status-absent)',  bg: 'var(--status-absent-bg)' },
  pending:  { color: 'var(--accent)',          bg: 'rgba(66,133,244,0.1)' },
}[s] || { color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' });

const LEAVE_COLORS = {
  medical: '#ef4444', personal: '#6366f1', family: '#f59e0b',
  academic: '#10b981', other: '#8b5cf6',
};

const HODLeaveApproval = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [filter, setFilter] = useState('pending');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await getDepartmentLeaves(filter === 'all' ? null : filter);
      const data = r.data;
      setLeaves(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
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

  const filterCounts = { pending: 0, approved: 0, rejected: 0, all: leaves.length };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.3)', display: 'flex' }}>
            <Shield size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Leave Approvals</h1>
            <p className="page-subtitle">Review and approve student leave requests from your department</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-accent' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', textTransform: 'capitalize', gap: '0.3rem' }}>
              {f === 'pending' && <Clock size={12} />}
              {f === 'approved' && <CheckCircle2 size={12} />}
              {f === 'rejected' && <XCircle size={12} />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : leaves.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Shield size={36} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p>No {filter !== 'all' ? filter : ''} leave requests.</p>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaves.map(leave => {
            const st = statusStyle(leave.status);
            const ltColor = LEAVE_COLORS[leave.leaveType] || '#6366f1';
            const isMedical = leave.leaveType === 'medical';
            const hasDoc = !!leave.medicalDocument;

            return (
              <div key={leave._id} className="card lift" style={{ padding: '1.25rem 1.5rem' }}>
                {/* Top row: student + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {leave.student?.name || 'Student'}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>{leave.student?.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Leave type badge */}
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, border: `1.5px solid ${ltColor}`, color: ltColor, display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'capitalize' }}>
                      {isMedical && <Stethoscope size={11} />}{leave.leaveType}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', background: st.bg, color: st.color }}>
                      {leave.status === 'approved' ? <CheckCircle2 size={12} /> : leave.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                      {leave.status}
                    </span>
                  </div>
                </div>

                {/* Leave details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>From:</span> <strong>{new Date(leave.startDate).toLocaleDateString()}</strong></div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>To:</span> <strong>{new Date(leave.endDate).toLocaleDateString()}</strong></div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Days:</span> <strong>{leave.totalDays}</strong></div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Applied:</span> <strong>{new Date(leave.createdAt).toLocaleDateString()}</strong></div>
                </div>

                {/* Reason */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Reason:</strong> {leave.reason}
                </p>

                {/* Medical document section */}
                {isMedical && (
                  <div style={{ padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem', border: `1px solid ${hasDoc ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, background: hasDoc ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <FileText size={15} color={hasDoc ? 'var(--status-present)' : '#f59e0b'} />
                    {hasDoc ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--status-present)', fontWeight: 600 }}>Medical document uploaded</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{leave.medicalDocumentName}</span>
                        <a href={leave.medicalDocument} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                          <ExternalLink size={11} /> View Document
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={14} color="#f59e0b" />
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>No medical document uploaded yet</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>— student may upload later</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous remarks */}
                {leave.remarks && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    Remarks: {leave.remarks}
                  </p>
                )}
                {leave.reviewedBy?.name && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                    Reviewed by: <strong>{leave.reviewedBy.name}</strong>
                  </p>
                )}

                {/* Approve/Reject actions */}
                {leave.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    {isMedical && !hasDoc && (
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: 'auto' }}>
                        <AlertTriangle size={12} /> Awaiting medical document
                      </span>
                    )}
                    <input
                      type="text"
                      placeholder="Add remarks (optional)"
                      value={remarks[leave._id] || ''}
                      onChange={e => setRemarks(r => ({ ...r, [leave._id]: e.target.value }))}
                      style={{ flex: 1, minWidth: 180, padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                    />
                    <button
                      onClick={() => handleProcess(leave._id, 'approved')}
                      className="btn btn-accent"
                      disabled={processing === leave._id}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                      {processing === leave._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleProcess(leave._id, 'rejected')}
                      className="btn btn-secondary"
                      disabled={processing === leave._id}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem', color: 'var(--status-absent)', borderColor: 'var(--status-absent)' }}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HODLeaveApproval;
