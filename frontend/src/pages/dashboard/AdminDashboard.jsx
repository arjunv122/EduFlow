import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { getAnnouncements } from '../../api/announcementApi';
import {
  Users, BookOpen, BarChart3, Megaphone, UserCog, FileText,
  Settings, ClipboardCheck, ArrowRight
} from 'lucide-react';

const KPICard = ({ icon: Icon, label, value, link, accentColor = 'var(--accent)' }) => (
  <div className="kpi-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <Icon size={15} style={{ color: accentColor }} />
    </div>
    <div className="kpi-value">{value ?? '—'}</div>
    {link && (
      <Link to={link} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
        Manage <ArrowRight size={11} />
      </Link>
    )}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [dynamicStats, setDynamicStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    getAnnouncements().then(r => setAnnouncements((r.data?.data || []).slice(0, 5))).catch(() => {});
    
    // Fetch dynamic stats
    Promise.all([
      api.get('/student').catch(() => ({ data: { data: [] } })),
      api.get('/faculty').catch(() => ({ data: { data: [] } })),
      api.get('/academics/departments').catch(() => ({ data: { data: [] } }))
    ]).then(([studentsRes, facultyRes, deptsRes]) => {
      setDynamicStats({
        totalStudents: studentsRes.data?.data?.length || 0,
        totalFaculty: facultyRes.data?.data?.length || 0,
        totalDepartments: deptsRes.data?.data?.length || 0,
        totalCourses: 0, // Placeholder if no courses API yet
      });
    });
  }, []);

  const quickActions = [
    { to: '/dashboard/admin/analytics', icon: BarChart3, label: 'View Analytics' },
    { to: '/dashboard/admin/users', icon: UserCog, label: 'User Accounts' },
    { to: '/dashboard/admin/audit', icon: FileText, label: 'Audit Log' },
    { to: '/dashboard/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome */}
      <div style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.75rem' }}>
        <h1 className="page-title serif-heading">
          {user?.institution?.name || 'Institution'} Administration
        </h1>
        <p className="page-subtitle">Logged in as <strong>{user?.name}</strong> · Role: Admin</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <KPICard icon={Users} label="Total Students" value={dynamicStats.totalStudents} link="/students" accentColor="var(--accent)" />
        <KPICard icon={Users} label="Total Faculty" value={dynamicStats.totalFaculty} link="/faculty" accentColor="var(--status-info)" />
        <KPICard icon={BookOpen} label="Active Courses" value={dynamicStats.totalCourses} link="/academics" accentColor="var(--status-present)" />
        <KPICard icon={BarChart3} label="Departments" value={dynamicStats.totalDepartments} link="/academics" accentColor="var(--status-late)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Quick Links — Admin Exclusive */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Exclusive Actions</h3>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {quickActions.map(({ to, icon: Icon, label }) => (
              <Link
                key={to} to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 500,
                  textDecoration: 'none', transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <Icon size={14} style={{ color: 'var(--accent)' }} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Announcements</h3>
            <Link to="/announcements" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No announcements yet.</p>
            ) : announcements.map(a => (
              <div key={a._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <Megaphone size={12} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
