import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { initiateSession, markAttendance, submitSession } from '../../api/attendanceApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Play, Send, CheckCircle2,
  Loader2, AlertTriangle
} from 'lucide-react';

const STATUS_COLORS = {
  present: { bg: 'var(--status-present-bg)', border: 'var(--status-present)', text: 'var(--status-present)' },
  absent:  { bg: 'var(--status-absent-bg)',  border: 'var(--status-absent)',  text: 'var(--status-absent)' },
  late:    { bg: 'var(--status-warning-bg)', border: 'var(--status-warning)', text: 'var(--status-warning)' },
  excused: { bg: 'rgba(59,130,246,0.1)',     border: '#3b82f6',              text: '#60a5fa' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.absent;
  return (
    <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '1rem', border: `1px solid ${c.border}`, color: c.text, background: c.bg, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
};

const StatusToggle = ({ current, onChange }) => {
  const statuses = ['present', 'late', 'absent', 'excused'];
  const initials = { present: 'P', late: 'L', absent: 'A', excused: 'E' };
  return (
    <div style={{ display: 'flex', gap: '0.35rem' }}>
      {statuses.map((s) => {
        const c = STATUS_COLORS[s];
        const active = current === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={s.charAt(0).toUpperCase() + s.slice(1)}
            style={{
              width: 30, height: 30, borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700,
              border: `2px solid ${active ? c.border : 'var(--border)'}`,
              background: active ? c.bg : 'var(--bg-tertiary)',
              color: active ? c.text : 'var(--text-tertiary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {initials[s]}
          </button>
        );
      })}
    </div>
  );
};

const AttendanceDashboard = () => {
  const { user } = useAuth();
  const [classSections, setClassSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    method: 'manual',
  });
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [populatedStudents, setPopulatedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const summary = records.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    { present: 0, absent: 0, late: 0, excused: 0 }
  );

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await api.get('/academics/classes');
        const sections = res.data?.data || [];
        const filtered =
          user?.role === 'faculty'
            ? sections.filter((s) => s.faculty?._id === user._id || s.faculty === user._id)
            : sections;
        setClassSections(filtered);
        if (filtered.length > 0) setSelectedSection(filtered[0]._id);
      } catch {
        toast.error('Failed to load class sections.');
      }
    };
    fetchSections();
  }, [user]);

  const handleStartSession = async () => {
    if (!selectedSection) return toast.error('Please select a class section.');
    setLoading(true);
    try {
      const payload = { classSectionId: selectedSection, ...sessionForm, isSubstitute: false };
      const res = await initiateSession(payload);
      const sess = res.data?.data;
      setSession(sess);

      let studentMap = {};
      try {
        const studRes = await api.get('/student');
        (studRes.data?.data || []).forEach((s) => { studentMap[s.user?._id || s._id] = s; });
      } catch { /* ignore */ }

      const populated = sess.records.map((r) => {
        const studentId = r.student?.toString?.() || r.student;
        const profile = studentMap[studentId] || {};
        return {
          student: studentId,
          name: profile.user?.name || profile.name || `Student (${String(studentId).slice(-4)})`,
          rollNumber: profile.rollNumber || '—',
          status: r.status,
        };
      });

      setPopulatedStudents(populated);
      setRecords(populated.map((s) => ({ student: s.student, status: s.status })));
      toast.success('Session started! Mark attendance below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setRecords((prev) => prev.map((r) => (r.student === studentId ? { ...r, status: newStatus } : r)));
    setPopulatedStudents((prev) => prev.map((s) => (s.student === studentId ? { ...s, status: newStatus } : s)));
  };

  const handleMarkAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
    setPopulatedStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await markAttendance(session._id, records);
      toast.success('Attendance saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (!window.confirm('Submit attendance? This will finalize the session and send alerts if needed.')) return;
    setSubmitting(true);
    try {
      await markAttendance(session._id, records);
      await submitSession(session._id);
      toast.success('Attendance submitted successfully!');
      setSession(null);
      setRecords([]);
      setPopulatedStudents([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSectionData = classSections.find((s) => s._id === selectedSection);

  const fieldLabel = (text) => (
    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>
      {text}
    </label>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <ClipboardCheck size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Attendance</h1>
            <p className="page-subtitle">Mark and manage class attendance sessions</p>
          </div>
        </div>
      </div>

      {!session ? (
        /* ── Session Setup Card ── */
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Start a New Attendance Session
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              {fieldLabel('Class Section')}
              <select
                id="section-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{ width: '100%' }}
              >
                {classSections.length === 0 && <option value="">No sections found</option>}
                {classSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.course?.name || s.course} — Sec {s.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {fieldLabel('Date')}
              <input
                type="date"
                value={sessionForm.date}
                onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              {fieldLabel('Start Time')}
              <input
                type="time"
                value={sessionForm.startTime}
                onChange={(e) => setSessionForm((f) => ({ ...f, startTime: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              {fieldLabel('End Time')}
              <input
                type="time"
                value={sessionForm.endTime}
                onChange={(e) => setSessionForm((f) => ({ ...f, endTime: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              {fieldLabel('Method')}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['manual', 'qr'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSessionForm((f) => ({ ...f, method: m }))}
                    className={sessionForm.method === m ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ fontSize: '0.875rem', padding: '0.45rem 1rem' }}
                  >
                    {m === 'qr' ? 'QR Scan' : 'Manual'}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="start-session-btn"
              onClick={handleStartSession}
              disabled={loading || !selectedSection}
              className="btn btn-accent"
              style={{ gap: '0.5rem', marginLeft: 'auto', opacity: (!selectedSection || loading) ? 0.5 : 1 }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
              {loading ? 'Starting…' : 'Start Session'}
            </button>
          </div>

          {sessionForm.method === 'qr' && (
            <div style={{ padding: '0.875rem 1rem', borderRadius: 8, background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--status-warning)', margin: 0 }}>
                QR scan mode will generate a time-limited code for students to self-mark. Full QR UI coming in the next sprint.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Active Session Panel ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Session meta bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid var(--status-present)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--status-present)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedSectionData?.course?.name || 'Session'} — Sec {selectedSectionData?.section}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {sessionForm.date} · {sessionForm.startTime}–{sessionForm.endTime}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              {[
                { k: 'present', color: 'var(--status-present)' },
                { k: 'late',    color: 'var(--status-warning)' },
                { k: 'absent',  color: 'var(--status-absent)' },
              ].map(({ k, color }) => (
                <span key={k} style={{ fontWeight: 600, color, textTransform: 'capitalize' }}>
                  {summary[k]} {k}
                </span>
              ))}
              <span style={{ color: 'var(--text-secondary)' }}>/ {records.length} total</span>
            </div>
          </div>

          {/* Bulk actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Mark all as:</span>
            {['present', 'absent', 'late', 'excused'].map((s) => {
              const c = STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => handleMarkAll(s)}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '1rem', border: `1px solid ${c.border}`, color: c.text, background: c.bg, cursor: 'pointer', textTransform: 'capitalize', transition: 'opacity 0.15s' }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Student list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                    {['#', 'Student', 'Roll No.', 'Status', 'Mark'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {populatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                        No students enrolled in this section yet.
                      </td>
                    </tr>
                  )}
                  {populatedStudents.map((student, idx) => (
                    <tr
                      key={student.student}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-tertiary)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #4A90D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {student.name?.[0] || '?'}
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)' }}>{student.rollNumber}</td>
                      <td style={{ padding: '0.75rem 1.25rem' }}><StatusBadge status={student.status} /></td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <StatusToggle current={student.status} onChange={(s) => handleStatusChange(student.student, s)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button id="save-attendance-btn" onClick={handleSave} disabled={loading} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
              Save Progress
            </button>
            <button id="submit-attendance-btn" onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {submitting ? 'Submitting…' : 'Submit Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
