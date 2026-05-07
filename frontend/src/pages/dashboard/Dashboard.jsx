import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAnnouncements } from '../../api/announcementApi';
import { getMyAttendanceStats } from '../../api/attendanceApi';
import { getQuizzes } from '../../api/assessmentApi';
import {
  Users, GraduationCap, BookOpen, Layers, ArrowRight,
  ClipboardCheck, Megaphone, BookMarked, TrendingUp, AlertTriangle,
  CalendarDays, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, title, value, colorClass, delay, link }) => (
  <div
    className="glass-panel p-6 rounded-xl border border-border-color shadow-sm relative overflow-hidden animate-fade-in transition-all hover:scale-[1.02] hover:shadow-md hover:border-primary-color/30"
    style={{ animationDelay: delay }}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${colorClass}`} />
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-text-primary mt-2">{value ?? '—'}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 backdrop-blur-sm border border-white/5`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    {link && (
      <Link to={link} className="mt-4 flex items-center text-sm font-medium text-primary-color hover:underline gap-1">
        Manage <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

// Attendance ring widget for students
const AttendanceWidget = ({ percentage }) => {
  const radius = 40;
  const stroke = 6;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg]">
      <circle cx={radius} cy={radius} r={norm} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={radius} cy={radius} r={norm} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────
const AdminDashboard = ({ user }) => {
  const stats = user?.institution?.stats || {};
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  useEffect(() => {
    getAnnouncements().then((r) => setRecentAnnouncements((r.data?.data || []).slice(0, 3))).catch(() => {});
  }, []);

  const quickActions = [
    { label: 'Manage Substitutions', to: '/substitutions', color: 'text-primary-color', bg: 'bg-primary-color/10' },
    { label: 'Add New Course',       to: '/academics',      color: 'text-secondary-color', bg: 'bg-secondary-color/10' },
    { label: 'Enroll Students',      to: '/students',       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'New Announcement',     to: '/announcements',  color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative glass-panel p-8 rounded-2xl border border-primary-color/20 overflow-hidden bg-gradient-to-br from-surface-color to-bg-color">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-color/10 rounded-full blur-[80px]" />
        <div className="absolute left-1/4 bottom-0 w-48 h-48 bg-secondary-color/10 rounded-full blur-[60px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-color to-secondary-color">{user?.name}</span>!
            </h1>
            <p className="text-text-secondary text-lg">
              Here's what's happening at <strong className="text-text-primary">{user?.institution?.name || 'your institution'}</strong> today.
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full bg-primary-color/10 text-primary-color border border-primary-color/20">
            Admin Portal
          </span>
        </div>
      </div>

      {/* KPI stats */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">Institution Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon={Users} title="Total Students" value={stats.totalStudents} colorClass="bg-blue-500" delay="0.1s" link="/students" />
          <StatCard icon={GraduationCap} title="Total Faculty" value={stats.totalFaculty} colorClass="bg-purple-500" delay="0.2s" link="/faculty" />
          <StatCard icon={Layers} title="Departments" value={stats.totalDepartments} colorClass="bg-emerald-500" delay="0.3s" link="/academics" />
          <StatCard icon={BookOpen} title="Courses" value={stats.totalCourses} colorClass="bg-amber-500" delay="0.4s" link="/academics" />
        </div>
      </div>

      {/* Quick actions + recent announcements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="p-4 rounded-lg bg-surface-color hover:bg-surface-hover border border-border-color transition-all hover:border-primary-color/30 flex items-center gap-3 no-underline"
              >
                <div className={`${a.bg} p-2 rounded ${a.color}`}><BookMarked size={16} /></div>
                <span className="font-medium text-text-primary text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">Recent Announcements</h3>
            <Link to="/announcements" className="text-xs text-primary-color hover:underline">View all →</Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-text-secondary">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((a) => (
                <div key={a._id} className="flex items-start gap-2">
                  <Megaphone size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FACULTY DASHBOARD ─────────────────────────────────────────────
const FacultyDashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getQuizzes().then((r) => setQuizzes((r.data?.data || []).slice(0, 4))).catch(() => {});
    getAnnouncements().then((r) => setAnnouncements((r.data?.data || []).slice(0, 3))).catch(() => {});
  }, []);

  const pendingGrading = quizzes.filter((q) => q.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative glass-panel p-7 rounded-2xl border border-secondary-color/20 overflow-hidden">
        <div className="absolute right-0 top-0 w-56 h-56 bg-secondary-color/10 rounded-full blur-[70px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Good day, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-text-secondary">Here's your teaching overview for today.</p>
        </div>
      </div>

      {/* Faculty stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={ClipboardCheck} title="Mark Attendance" value="Quick Start →" colorClass="bg-blue-500" delay="0.1s" link="/attendance" />
        <StatCard icon={BookOpen} title="My Quizzes" value={quizzes.length} colorClass="bg-purple-500" delay="0.2s" link="/assessments" />
        <StatCard icon={AlertTriangle} title="Pending Grading" value={pendingGrading} colorClass="bg-amber-500" delay="0.3s" link="/assessments" />
      </div>

      {/* Recent quizzes + announcements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">My Quizzes</h3>
            <Link to="/assessments" className="text-xs text-primary-color hover:underline">View all →</Link>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-sm text-text-secondary">No quizzes created yet.</p>
          ) : (
            <div className="space-y-2">
              {quizzes.map((q) => (
                <div key={q._id} className="flex items-center justify-between py-2 border-b border-border-color/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{q.title}</p>
                    <p className="text-xs text-text-secondary capitalize">{q.status}</p>
                  </div>
                  <span className="text-xs text-text-secondary">{q.totalMarks} marks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Announcements</h3>
            <Link to="/announcements" className="text-xs text-primary-color hover:underline">View all →</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-text-secondary">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a._id} className="flex items-start gap-2">
                  <Megaphone size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-text-primary">{a.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── STUDENT DASHBOARD ─────────────────────────────────────────────
const StudentDashboard = ({ user }) => {
  const [attendance, setAttendance] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getMyAttendanceStats().then((r) => setAttendance(r.data?.data)).catch(() => {});
    getQuizzes().then((r) => setQuizzes((r.data?.data || []).slice(0, 4))).catch(() => {});
    getAnnouncements().then((r) => setAnnouncements((r.data?.data || []).slice(0, 3))).catch(() => {});
  }, []);

  const pct = attendance?.percentage ?? 0;

  const upcomingQuizzes = quizzes.filter((q) => {
    const start = new Date(q.startDateTime);
    return start > new Date() || q.status === 'active';
  });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative glass-panel p-7 rounded-2xl border border-primary-color/20 overflow-hidden">
        <div className="absolute right-0 top-0 w-56 h-56 bg-primary-color/10 rounded-full blur-[70px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Welcome, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-text-secondary">Here's your academic summary.</p>
        </div>
      </div>

      {/* Student stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attendance ring */}
        <div className="glass-panel p-6 rounded-xl border border-border-color flex items-center gap-5">
          <div className="relative shrink-0">
            <AttendanceWidget percentage={pct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Attendance</p>
            <p className="text-text-primary text-sm font-medium">
              {pct >= 75 ? '✅ On track' : pct >= 60 ? '⚠️ At risk' : '🚨 Critical'}
            </p>
            <Link to="/student/attendance" className="text-xs text-primary-color hover:underline mt-1 block">
              View details →
            </Link>
          </div>
        </div>

        <StatCard icon={BookOpen} title="Upcoming Quizzes" value={upcomingQuizzes.length} colorClass="bg-purple-500" delay="0.2s" link="/student/assessments" />
        <StatCard icon={Megaphone} title="Announcements" value={announcements.length} colorClass="bg-amber-500" delay="0.3s" link="/announcements" />
      </div>

      {/* Quiz list + announcements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Upcoming Quizzes</h3>
            <Link to="/student/assessments" className="text-xs text-primary-color hover:underline">View all →</Link>
          </div>
          {upcomingQuizzes.length === 0 ? (
            <p className="text-sm text-text-secondary">No upcoming quizzes.</p>
          ) : (
            <div className="space-y-2">
              {upcomingQuizzes.map((q) => (
                <div key={q._id} className="flex items-center justify-between py-2.5 border-b border-border-color/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{q.title}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(q.startDateTime).toLocaleDateString()} · {q.duration} min
                    </p>
                  </div>
                  {q.status === 'active' && (
                    <Link to={`/assessments/quiz/${q._id}`} className="text-xs btn btn-primary px-3 py-1 no-underline">
                      Start →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-xl border border-border-color">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Latest Announcements</h3>
            <Link to="/announcements" className="text-xs text-primary-color hover:underline">View all →</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-text-secondary">No announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a._id} className="flex items-start gap-2">
                  <Megaphone size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ROOT DASHBOARD (role dispatcher) ──────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
    case 'superadmin':
      return <AdminDashboard user={user} />;
    case 'faculty':
      return <FacultyDashboard user={user} />;
    case 'student':
      return <StudentDashboard user={user} />;
    default:
      return <AdminDashboard user={user} />;
  }
};

export default Dashboard;
