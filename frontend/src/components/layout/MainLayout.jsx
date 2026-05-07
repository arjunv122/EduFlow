import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, BookOpen, Users, CalendarDays, ClipboardCheck,
  Megaphone, HelpCircle, Settings, LogOut, Menu, X, Sun, Moon,
  ShieldAlert, BarChart3, FileText, UserCog, AlertCircle, Clock,
  Video, Calendar, Shield
} from 'lucide-react';

// Coming-soon nav entry (visual, not clickable)
const ComingSoonNavItem = ({ icon: Icon, name, eta }) => (
  <div className="nav-item nav-item-soon">
    <Icon size={15} />
    <span>{name}</span>
    <span className="nav-coming-soon-tag">{eta}</span>
  </div>
);

// Inline SRIHER triangle logo
const SRIHERMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,4 97,93 3,93" fill="#B91C1C" />
    <line x1="50" y1="22" x2="50" y2="82" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="21" r="3.5" fill="white" />
    <path d="M33,33 C36,27 44,29 50,31 C56,29 64,27 67,33" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M47,34 C38,44 43,53 47,60 C43,67 39,75 45,82" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M53,34 C62,44 57,53 53,60 C57,67 61,75 55,82" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </svg>
);

// Role-specific navigation trees
const NAV_CONFIG = {
  superadmin: [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard',    path: '/dashboard/admin',   icon: LayoutDashboard },
        { name: 'Announcements',path: '/announcements',     icon: Megaphone },
      ],
    },
    {
      section: 'Academic',
      items: [
        { name: 'Academics',    path: '/academics',         icon: BookOpen },
        { name: 'Faculty',      path: '/faculty',           icon: Users },
        { name: 'Students',     path: '/students',          icon: Users },
        { name: 'Substitutions',path: '/substitutions',     icon: CalendarDays },
      ],
    },
    {
      section: 'Admin Exclusive',
      items: [
        { name: 'Analytics',      path: '/dashboard/admin/analytics', icon: BarChart3 },
        { name: 'User Accounts',  path: '/dashboard/admin/users',     icon: UserCog },
        { name: 'Audit Log',      path: '/dashboard/admin/audit',     icon: FileText },
        { name: 'Settings',       path: '/dashboard/admin/settings',  icon: Settings },
      ],
    },
    {
      section: 'Account',
      items: [
        { name: 'Password & Security', path: '/profile/password', icon: Settings },
      ],
    },
  ],

  admin: [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard',    path: '/dashboard/admin',   icon: LayoutDashboard },
        { name: 'Announcements',path: '/announcements',     icon: Megaphone },
      ],
    },
    {
      section: 'Academic',
      items: [
        { name: 'Academics',    path: '/academics',         icon: BookOpen },
        { name: 'Faculty',      path: '/faculty',           icon: Users },
        { name: 'Students',     path: '/students',          icon: Users },
        { name: 'Substitutions',path: '/substitutions',     icon: CalendarDays },
      ],
    },
    {
      section: 'Admin Exclusive',
      items: [
        { name: 'Analytics',      path: '/dashboard/admin/analytics',    icon: BarChart3 },
        { name: 'User Accounts',  path: '/dashboard/admin/users',        icon: UserCog },
        { name: 'Audit Log',      path: '/dashboard/admin/audit',        icon: FileText },
        { name: 'Settings',       path: '/dashboard/admin/settings',     icon: Settings },
      ],
    },
    {
      section: 'Support',
      items: [
        { name: 'Support Tickets', path: '/support', icon: HelpCircle },
      ],
    },
    {
      section: 'Account',
      items: [
        { name: 'Password & Security', path: '/profile/password', icon: Settings },
      ],
    },
  ],

  faculty: [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard',    path: '/dashboard/faculty', icon: LayoutDashboard },
        { name: 'Announcements',path: '/announcements',     icon: Megaphone },
      ],
    },
    {
      section: 'Teaching',
      items: [
        { name: 'Attendance',   path: '/attendance',        icon: ClipboardCheck },
        { name: 'Assessments',  path: '/assessments',       icon: BookOpen },
        { name: 'Gradebook',    path: '/gradebook',         icon: BarChart3 },
        { name: 'Substitutions',path: '/substitutions',     icon: CalendarDays },
        { name: 'Meetings',     path: '/faculty/meetings',  icon: Video },
      ],
    },
    {
      section: 'HOD',
      items: [
        { name: 'Leave Approvals', path: '/faculty/leaves', icon: Shield },
      ],
    },
    {
      section: 'Support',
      items: [
        { name: 'Support Tickets', path: '/support', icon: HelpCircle },
      ],
    },
    {
      section: 'Account',
      items: [
        { name: 'Password & Security', path: '/profile/password', icon: Settings },
      ],
    },
  ],

  student: [
    {
      section: 'My Studies',
      items: [
        { name: 'Dashboard',       path: '/dashboard/student',  icon: LayoutDashboard },
        { name: 'My Timetable',    path: '/student/timetable',  icon: CalendarDays },
        { name: 'My Attendance',   path: '/student/attendance', icon: ClipboardCheck },
        { name: 'My Assessments',  path: '/student/assessments',icon: BookOpen },
        { name: 'My Leaves',       path: '/student/leaves',     icon: Calendar },
        { name: 'Meetings',        path: '/student/meetings',   icon: Video },
        { name: 'Announcements',   path: '/announcements',      icon: Megaphone },
      ],
    },
    {
      section: 'Support',
      items: [
        { name: 'Support Tickets', path: '/support', icon: HelpCircle },
      ],
    },
    {
      section: 'Account',
      items: [
        { name: 'Password & Security', path: '/profile/password', icon: Settings },
      ],
    },
  ],
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = NAV_CONFIG[user?.role] || NAV_CONFIG.student;

  const sidebarStyle = {
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          ...sidebarStyle,
          position: 'fixed',
          insetBlock: 0,
          left: 0,
          zIndex: 50,
          width: 220,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 200ms ease',
        }}
        className="lg-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SRIHERMark size={30} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.01em' }}>SRIHER</span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2 }}>Academic Portal</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="btn-ghost" style={{ padding: '0.3rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem 1rem' }}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items?.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path.endsWith('/dashboard/admin') || item.path.endsWith('/dashboard/student') || item.path.endsWith('/dashboard/faculty')}
                    className={({ isActive }) =>
                      `nav-item${isActive ? ' active' : ''}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
              {group.comingSoon?.map((item) => (
                <ComingSoonNavItem key={item.name} {...item} />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-muted)',
              border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem',
              flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={toggleTheme} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={handleLogout} className="btn-ghost" title="Logout"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Desktop static sidebar (lg+) ── */}
      <aside
        style={{ ...sidebarStyle, width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
          <SRIHERMark size={30} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.01em' }}>SRIHER</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2 }}>Academic Portal</span>
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem 1rem' }}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items?.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path.endsWith('/dashboard/admin') || item.path.endsWith('/dashboard/student') || item.path.endsWith('/dashboard/faculty')}
                    className={({ isActive }) =>
                      `nav-item${isActive ? ' active' : ''}`
                    }
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
              {group.comingSoon?.map((item) => (
                <ComingSoonNavItem key={item.name} {...item} />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-muted)', border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={toggleTheme} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={handleLogout} className="btn-ghost" title="Logout"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile topbar */}
        <header style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          gap: '0.75rem',
        }} className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost" style={{ padding: '0.4rem' }}>
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SRIHERMark size={24} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>SRIHER</span>
          </div>
        </header>

        {/* Page content */}
        <div 
          key={location.pathname} 
          style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }} 
          className="animate-page-transition"
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        .desktop-sidebar { display: none; }
        .mobile-header { display: flex; }
        .lg-sidebar { display: flex; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
          .lg-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
