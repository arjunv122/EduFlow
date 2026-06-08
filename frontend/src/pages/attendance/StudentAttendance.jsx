import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyAttendanceStats, getMyCalendar, getMyStatsAllCourses, exportAttendanceReport } from '../../api/attendanceApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ClipboardCheck, TrendingUp, AlertTriangle, ChevronDown, Loader2, Download, BookOpen } from 'lucide-react';

// Circular progress ring for attendance percentage
const AttendanceRing = ({ percentage }) => {
  const radius = 52;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 75
      ? 'var(--status-present)'
      : percentage >= 60
      ? 'var(--status-warning)'
      : 'var(--status-absent)';

  return (
    <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background track */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
    </svg>
  );
};

// Mini calendar heatmap (last 6 weeks)
const AttendanceHeatmap = ({ sessions }) => {
  const today = new Date();
  const cells = [];

  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];

    const session = sessions.find((s) => {
      const sd = new Date(s.date).toISOString().split('T')[0];
      return sd === key;
    });

    let bgColor = 'var(--bg-tertiary)'; // No class
    if (session) {
      bgColor =
        ['present', 'late'].includes(session.status)
          ? 'var(--status-present)'
          : 'var(--status-absent)';
    }

    cells.push(
      <div
        key={key}
        title={`${key}${session ? ` — ${session.status}` : ' (no class)'}`}
        style={{ width: '1rem', height: '1rem', borderRadius: '4px', background: bgColor, cursor: 'default', transition: 'transform 0.2s' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
      {cells}
    </div>
  );
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [stats, setStats] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseStats, setCourseStats] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/academics/courses');
        setCourses(res.data?.data || []);
      } catch {
        // silently fail
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMyAttendanceStats(selectedCourse || null);
        setStats(res.data?.data);
      } catch (err) {
        toast.error('Failed to load attendance stats.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCourse]);

  // Fetch calendar heatmap data
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const now = new Date();
        const res = await getMyCalendar(now.getMonth() + 1, now.getFullYear());
        const calendar = res.data?.data || {};
        // Convert calendar object { 'YYYY-MM-DD': 'status' } to array format for heatmap
        const sessions = Object.entries(calendar).map(([date, status]) => ({ date, status }));
        setSessionHistory(sessions);
      } catch {
        // silently fail — heatmap just stays empty
      }
    };
    fetchCalendar();
  }, []);

  useEffect(() => {
    const fetchCourseStats = async () => {
      try {
        const res = await getMyStatsAllCourses();
        setCourseStats(res.data?.data || []);
      } catch {
        // silently fail
      }
    };
    fetchCourseStats();
  }, []);

  const percentage = stats?.percentage ?? 0;
  const isLow = percentage < 75 && (stats?.total || 0) > 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <ClipboardCheck size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">My Attendance</h1>
            <p className="page-subtitle">Track your attendance across all courses</p>
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filter by Course:</label>
        <div style={{ position: 'relative', width: '300px' }}>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', appearance: 'none', fontSize: '0.9rem' }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem' }}>
          <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Low attendance warning */}
          {isLow && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={18} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600 }}>Low Attendance Warning</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.9 }}>
                  Your attendance is <strong>{percentage.toFixed(1)}%</strong>, which is below the required 75%. Please attend classes regularly to avoid academic penalty.
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Ring card */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Attendance</p>
              <div style={{ position: 'relative' }}>
                <AttendanceRing percentage={percentage} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: percentage >= 75 ? 'var(--status-present)' : percentage >= 60 ? 'var(--status-warning)' : 'var(--status-absent)'
                    }}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {stats?.present || 0} present out of {stats?.total || 0} classes
              </p>
            </div>

            {/* Classes Present */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--status-present-bg)', border: '1px solid var(--status-present)' }}>
                  <TrendingUp size={18} color="var(--status-present)" />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classes Attended</span>
              </div>
              <div>
                <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.present || 0}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>out of {stats?.total || 0} total classes</p>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: '1rem', height: '0.5rem', borderRadius: '1rem', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '1rem',
                    transition: 'width 0.7s ease, background 0.7s ease',
                    width: `${percentage}%`,
                    background: percentage >= 75 ? 'var(--status-present)' : percentage >= 60 ? 'var(--status-warning)' : 'var(--status-absent)',
                  }}
                />
              </div>
            </div>

            {/* Min classes needed */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)' }}>
                  <AlertTriangle size={18} color="var(--status-warning)" />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required to Reach 75%</span>
              </div>
              {percentage >= 75 ? (
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-present)' }}>✓ Safe</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    You can miss up to{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {Math.floor((stats?.present / 0.75) - stats?.total)}
                    </strong>{' '}
                    more classes.
                  </p>
                </div>
              ) : (
                <div>
                  {stats?.total > 0 ? (
                    <>
                      <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--status-absent)' }}>
                        {Math.ceil((0.75 * stats.total - stats.present) / 0.25)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>consecutive classes needed</p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No data yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Attendance Calendar</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Last 6 weeks — green = attended, red = absent</p>
            <AttendanceHeatmap sessions={sessionHistory} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '0.75rem', height: '0.75rem', borderRadius: 2, background: 'var(--status-present)' }} /> Present / Late</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '0.75rem', height: '0.75rem', borderRadius: 2, background: 'var(--status-absent)' }} /> Absent</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '0.75rem', height: '0.75rem', borderRadius: 2, background: 'var(--bg-tertiary)' }} /> No Class</span>
            </div>
          </div>

          {/* Per-Subject Breakdown */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="var(--accent)" /> Subject-wise Attendance
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                onClick={async () => {
                  try {
                    const res = await exportAttendanceReport('csv');
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch { toast.error('Export failed'); }
                }}
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
            {courseStats.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No course data available yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Percentage</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map((cs, idx) => {
                      const pct = cs.percentage ?? 0;
                      const color = pct >= 75 ? 'var(--status-present)' : pct >= 60 ? 'var(--status-warning)' : 'var(--status-absent)';
                      const bg = pct >= 75 ? 'var(--status-present-bg)' : pct >= 60 ? 'var(--status-warning-bg)' : 'var(--status-absent-bg)';
                      return (
                        <tr key={cs.courseId || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {cs.courseName || 'Unknown'}
                            {cs.courseCode && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({cs.courseCode})</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-primary)' }}>{cs.present}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{cs.total}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color }}>{pct.toFixed(1)}%</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: bg, color }}>
                              {pct >= 75 ? 'Safe' : pct >= 60 ? 'Warning' : 'Critical'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;
