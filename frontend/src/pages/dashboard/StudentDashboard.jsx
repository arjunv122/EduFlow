import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMyAttendanceStats } from '../../api/attendanceApi';
import { getQuizzes, getAssignments, getMeetings } from '../../api/assessmentApi';
import { getAnnouncements } from '../../api/announcementApi';
import { BookOpen, Megaphone, ClipboardCheck, Clock, Video, FileText, ExternalLink, Calendar } from 'lucide-react';

// SVG Attendance Ring — turns rose below 75%
const AttendanceRing = ({ percentage }) => {
  const r = 36;
  const stroke = 5;
  const norm = r - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  const color = percentage >= 75 ? 'var(--status-present)' : percentage >= 60 ? 'var(--status-late)' : 'var(--status-absent)';

  return (
    <div style={{ position: 'relative', width: r * 2, height: r * 2, flexShrink: 0 }}>
      <svg width={r * 2} height={r * 2} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={r} cy={r} r={norm} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={r} cy={r} r={norm} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, color,
      }}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getMyAttendanceStats().then(r => setAttendance(r.data)).catch(() => {});
    getQuizzes().then(r => setQuizzes((r.data?.data || []).filter(q => q.status === 'active' || q.status === 'published').slice(0, 5))).catch(() => {});
    getAnnouncements().then(r => setAnnouncements((r.data?.data || []).slice(0, 4))).catch(() => {});
    getAssignments().then(r => setAssignments((r.data?.data || r.data || []).filter(a => a.status === 'published').slice(0, 5))).catch(() => {});
    getMeetings().then(r => setMeetings((r.data?.data || r.data || []).filter(m => new Date(m.scheduledAt) > new Date()).slice(0, 3))).catch(() => {});
  }, []);

  const pct = attendance?.percentage ?? 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.75rem' }}>
        <h1 className="page-title serif-heading">Student Portal</h1>
        <p className="page-subtitle">Welcome, <strong>{user?.name}</strong></p>
      </div>

      {/* Status summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Attendance widget */}
        <div className="card" style={{ borderLeft: pct < 75 ? '3px solid var(--status-absent)' : '3px solid var(--status-present)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AttendanceRing percentage={pct} />
            <div>
              <p className="kpi-label">My Attendance</p>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: pct >= 75 ? 'var(--status-present)' : 'var(--status-absent)', marginTop: '0.25rem' }}>
                {pct >= 75 ? 'On Track' : pct >= 60 ? 'At Risk' : '⚠ Critical — below 75%'}
              </p>
              <Link to="/student/attendance" style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.25rem', display: 'block' }}>
                View heatmap →
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming quizzes count */}
        <div className="kpi-card" style={{ borderLeft: '3px solid var(--status-info)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-label">Upcoming Quizzes</span>
            <BookOpen size={14} style={{ color: 'var(--status-info)' }} />
          </div>
          <div className="kpi-value">{quizzes.length}</div>
          <Link to="/student/assessments" style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'block' }}>
            View all →
          </Link>
        </div>

        {/* Announcements count */}
        <div className="kpi-card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-label">Announcements</span>
            <Megaphone size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="kpi-value">{announcements.length}</div>
          <Link to="/announcements" style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'block' }}>
            View all →
          </Link>
        </div>

        {/* Assignments count */}
        <div className="kpi-card" style={{ borderLeft: '3px solid var(--status-late)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-label">Open Assignments</span>
            <FileText size={14} style={{ color: 'var(--status-late)' }} />
          </div>
          <div className="kpi-value">{assignments.length}</div>
          <Link to="/student/assessments" style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'block' }}>
            View all →
          </Link>
        </div>

        {/* Meetings count */}
        <div className="kpi-card" style={{ borderLeft: '3px solid var(--status-present)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-label">Upcoming Meetings</span>
            <Video size={14} style={{ color: 'var(--status-present)' }} />
          </div>
          <div className="kpi-value">{meetings.length}</div>
          <Link to="/student/meetings" style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'block' }}>
            View all →
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Upcoming quizzes */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upcoming Quizzes</h3>
            <Link to="/student/assessments" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
            {quizzes.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No upcoming quizzes.</p>
              : quizzes.map(q => (
                <div key={q._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {q.duration} min
                    </p>
                  </div>
                  {q.status === 'active' && (
                    <Link to={`/assessments/quiz/${q._id}`}
                      style={{ padding: '0.25rem 0.6rem', background: 'var(--accent)', color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                      Start
                    </Link>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* Latest announcements */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Latest Announcements</h3>
            <Link to="/announcements" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {announcements.length === 0
              ? <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No announcements.</p>
              : announcements.map(a => (
                <div key={a._id} style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
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

export default StudentDashboard;
