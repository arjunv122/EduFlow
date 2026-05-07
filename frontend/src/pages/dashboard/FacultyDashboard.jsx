import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getQuizzesManage } from '../../api/assessmentApi';
import { getAnnouncements } from '../../api/announcementApi';
import { ClipboardCheck, BookOpen, BarChart3, Megaphone, ArrowRight } from 'lucide-react';

const statusBadge = (status) => ({
  draft:      'badge-neutral',
  published:  'badge-info',
  active:     'badge-present',
  completed:  'badge-warning',
}[status] || 'badge-neutral');

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getQuizzesManage().then(r => setQuizzes((r.data?.data || []).slice(0, 5))).catch(() => {});
    getAnnouncements().then(r => setAnnouncements((r.data?.data || []).slice(0, 4))).catch(() => {});
  }, []);

  const pendingGrading = quizzes.filter(q => q.status === 'completed' && !q.isPublished).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.75rem' }}>
        <h1 className="page-title serif-heading">Faculty Portal</h1>
        <p className="page-subtitle">Welcome, <strong>{user?.name}</strong></p>
      </div>

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { to: '/attendance', icon: ClipboardCheck, label: 'Mark Attendance', color: 'var(--accent)' },
          { to: '/assessments/quiz/new', icon: BookOpen, label: 'Create Quiz', color: 'var(--status-info)' },
          { to: '/gradebook', icon: BarChart3, label: `Grade (${pendingGrading} pending)`, color: pendingGrading > 0 ? 'var(--status-absent)' : 'var(--status-present)' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to} to={to}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)', border: `1px solid var(--border)`,
              borderLeft: `3px solid ${color}`, color: 'var(--text-primary)',
              fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          >
            <Icon size={16} style={{ color }} />
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Quizzes */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>My Quizzes</h3>
            <Link to="/assessments" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {quizzes.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No quizzes created yet.</p>
              : quizzes.map(q => (
                <div key={q._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</span>
                  <span className={`badge ${statusBadge(q.status)}`}>{q.status}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Announcements</h3>
            <Link to="/announcements" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {announcements.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No announcements.</p>
              : announcements.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <Megaphone size={12} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
