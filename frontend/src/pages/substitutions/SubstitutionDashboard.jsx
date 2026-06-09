import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CalendarDays, AlertTriangle, UserCheck, Clock, CheckCircle, Send, Loader2, FileText } from 'lucide-react';

// ─── Admin View: Pending substitutions with AI suggestions ──────────
const AdminSubstitutionView = () => {
  const [pendingSubs, setPendingSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/substitution/pending');
      setPendingSubs(res.data?.data || []);
    } catch {
      toast.error('Failed to load pending substitutions');
    } finally {
      setLoading(false);
    }
  };

  const assignSubstitute = async (subId, facultyId) => {
    try {
      setIsProcessing(subId);
      await api.put(`/substitution/${subId}/assign`, { substituteFacultyId: facultyId });
      toast.success('Substitute assigned successfully!');
      setPendingSubs(prev => prev.filter(s => s._id !== subId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign substitute');
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading pending substitutions…</p>
      </div>
    );
  }

  return (
    <>
      <div className="badge badge-warning" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', gap: '0.5rem', alignSelf: 'flex-start' }}>
        <AlertTriangle size={15} />
        {pendingSubs.length} Pending Actions
      </div>

      {pendingSubs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CheckCircle size={24} color="var(--status-present)" /></div>
            <h3>All Clear!</h3>
            <p>No pending substitutions require your attention right now.</p>
          </div>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pendingSubs.map((sub) => (
            <div key={sub._id} className="card lift" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--status-absent-bg)', border: '1px solid rgba(234,67,53,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--status-absent)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                    {sub.course?.name} ({sub.course?.code}) - Section {sub.classSection?.section}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span><strong style={{ color: 'var(--text-primary)' }}>Absent:</strong> {sub.originalFaculty?.name || 'Unknown'}</span>
                    <span><strong style={{ color: 'var(--text-primary)' }}>Date:</strong> {sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}</span>
                    <span><strong style={{ color: 'var(--text-primary)' }}>Time:</strong> {sub.startTime || 'TBD'} - {sub.endTime || 'TBD'}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={14} /> AI Recommended Substitutes
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {sub.aiSuggestions?.map((suggestion, idx) => (
                    <div key={suggestion.faculty?._id} style={{ position: 'relative', padding: '1.25rem', borderRadius: 'var(--radius-md)', background: idx === 0 ? 'var(--status-info-bg)' : 'var(--bg-secondary)', border: idx === 0 ? '1px solid rgba(74,144,217,0.3)' : '1px solid var(--border)' }}>
                      {idx === 0 && <div style={{ position: 'absolute', top: -8, right: -8, background: 'linear-gradient(135deg, var(--accent), var(--status-info))', color: 'var(--text-inverse)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4, transform: 'rotate(3deg)', boxShadow: 'var(--shadow-sm)' }}>Best Match</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{suggestion.faculty?.name}</h5>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          Score: <strong style={{ color: suggestion.score > 80 ? 'var(--status-info)' : suggestion.score > 50 ? 'var(--status-warning)' : 'var(--status-absent)' }}>{suggestion.score}</strong>
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '1rem', minHeight: 36, lineHeight: 1.4 }}>{suggestion.reason}</p>
                      <button onClick={() => assignSubstitute(sub._id, suggestion.faculty?._id)} disabled={isProcessing === sub._id} className={`btn ${idx === 0 ? 'btn-accent' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>
                        {isProcessing === sub._id ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  ))}
                  {(!sub.aiSuggestions || sub.aiSuggestions.length === 0) && (
                    <div style={{ gridColumn: '1 / -1', padding: '1rem', border: '1px dashed var(--border)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center' }}>
                      No available faculty found for this time slot.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ─── Faculty View: My leave requests & substitutions assigned to me ─
const FacultySubstitutionView = () => {
  const [leaves, setLeaves] = useState([]);
  const [subs, setSubs] = useState({ asOriginal: [], asSubstitute: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaves');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, subsRes] = await Promise.all([
        api.get('/substitution/my-leaves'),
        api.get('/substitution/my-substitutions'),
      ]);
      setLeaves(leavesRes.data?.data || []);
      setSubs(subsRes.data?.data || { asOriginal: [], asSubstitute: [] });
    } catch {
      toast.error('Failed to load substitution data');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: { bg: 'var(--status-warning-bg)', border: 'var(--status-warning)', text: 'var(--status-warning)' },
    approved: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', text: '#34d399' },
    rejected: { bg: 'var(--status-absent-bg)', border: 'var(--status-absent)', text: 'var(--status-absent)' },
    assigned: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', text: '#60a5fa' },
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading your substitution data…</p>
      </div>
    );
  }

  const tabs = [
    { key: 'leaves', label: 'My Leave Requests', count: leaves.length },
    { key: 'assigned', label: 'Assigned to Me', count: subs.asSubstitute?.length || 0 },
  ];

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600,
              borderRadius: '8px 8px 0 0', cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--accent-muted)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              border: activeTab === tab.key ? '1px solid var(--border-accent)' : '1px solid transparent',
              borderBottom: 'none', transition: 'all 0.15s',
            }}
          >
            {tab.label} <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', opacity: 0.7 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'leaves' && (
        leaves.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={24} color="var(--text-tertiary)" /></div>
              <h3>No Leave Requests</h3>
              <p>You haven't submitted any leave requests yet.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaves.map(leave => {
              const sc = statusColors[leave.status] || statusColors.pending;
              return (
                <div key={leave._id} className="card" style={{ padding: '1.25rem', borderLeft: `3px solid ${sc.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '1rem', border: `1px solid ${sc.border}`, color: sc.text, background: sc.bg, textTransform: 'capitalize' }}>
                          {leave.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{leave.leaveType || 'Leave'}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, margin: '0.25rem 0' }}>
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{leave.reason}</p>
                      {leave.adminRemarks && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                          Admin: "{leave.adminRemarks}"
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'assigned' && (
        (subs.asSubstitute?.length || 0) === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><UserCheck size={24} color="var(--text-tertiary)" /></div>
              <h3>No Assigned Substitutions</h3>
              <p>You haven't been assigned to cover any classes yet.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {subs.asSubstitute.map(sub => {
              const sc = statusColors[sub.status] || statusColors.assigned;
              return (
                <div key={sub._id} className="card" style={{ padding: '1.25rem', borderLeft: `3px solid ${sc.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                        {sub.course?.name} ({sub.course?.code}) — Sec {sub.classSection?.section}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Covering for <strong>{sub.originalFaculty?.name}</strong> on {sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.2rem 0 0' }}>
                        {sub.startTime} — {sub.endTime}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '1rem', border: `1px solid ${sc.border}`, color: sc.text, background: sc.bg, textTransform: 'capitalize' }}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </>
  );
};

// ─── Main Dashboard (role-aware) ────────────────────────────────────
const SubstitutionDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--status-warning-bg)', border: '1px solid rgba(232,160,32,0.3)', display: 'flex' }}>
            <CalendarDays size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">
              {isAdmin ? 'AI Substitution Management' : 'My Substitutions'}
            </h1>
            <p className="page-subtitle">
              {isAdmin ? 'Smart faculty reallocation for pending absences' : 'View your leave requests and substitution assignments'}
            </p>
          </div>
        </div>
      </div>

      {isAdmin ? <AdminSubstitutionView /> : <FacultySubstitutionView />}
    </div>
  );
};

export default SubstitutionDashboard;
