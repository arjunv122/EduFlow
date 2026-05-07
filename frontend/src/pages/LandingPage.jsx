import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, ArrowRight, ClipboardCheck, BookOpen, Calendar, Users, BarChart3, ShieldCheck } from 'lucide-react';

/* ─── SRIHER brand colours ─────────────────────────────── */
const NAVY   = '#0D1B3E';
const NAVY2  = '#162347';
const RED    = '#B91C1C';
const RED_LT = '#DC2626';
const GOLD   = '#F59E0B';

/* ─── Caduceus SVG inline logo ─────────────────────────── */
const SRIHERLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,4 97,93 3,93" fill={RED} />
    <polygon points="50,12 89,88 11,88" fill="none" stroke="#7F1D1D" strokeWidth="1.5"/>
    <line x1="50" y1="22" x2="50" y2="82" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="50" cy="21" r="3.5" fill="white"/>
    <path d="M33,33 C36,27 44,29 50,31 C56,29 64,27 67,33" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M47,34 C38,44 43,53 47,60 C43,67 39,75 45,82" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    <path d="M53,34 C62,44 57,53 53,60 C57,67 61,75 55,82" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
  </svg>
);

const FEATURES = [
  { icon: ClipboardCheck, color: '#10B981', title: 'Smart Attendance', desc: 'Real-time session-based attendance with QR support, bulk marking, and automated shortage alerts.' },
  { icon: BookOpen,       color: '#6366F1', title: 'Assessments & Quizzes', desc: 'Create, schedule, and grade MCQ/essay quizzes with instant results and a full gradebook.' },
  { icon: Calendar,       color: GOLD,      title: 'Substitution Engine', desc: 'Intelligent faculty substitution scheduling based on expertise, availability, and workload.' },
  { icon: Users,          color: RED_LT,    title: 'Faculty & Students', desc: 'Unified management of faculty profiles, student enrollment, departments, and class sections.' },
  { icon: BarChart3,      color: '#3B82F6', title: 'Analytics Dashboard', desc: 'Institution-wide insights: attendance trends, assessment performance, and faculty load metrics.' },
  { icon: ShieldCheck,    color: '#8B5CF6', title: 'Role-based Security', desc: 'Separate secure dashboards for admins, faculty, and students with JWT authentication.' },
];

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: isDark ? NAVY : '#F0F4FF', position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>

      {/* Background grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Glowing blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '45%', height: '55%', borderRadius: '50%', background: `radial-gradient(circle, ${RED}22, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-10%', width: '40%', height: '50%', borderRadius: '50%', background: `radial-gradient(circle, #3B82F622, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 2rem',
        background: isDark ? 'rgba(13,27,62,0.85)' : 'rgba(240,244,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SRIHERLogo size={36} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isDark ? '#fff' : '#0D1B3E', letterSpacing: '-0.01em', lineHeight: 1 }}>
              SRIHER
            </div>
            <div style={{ fontSize: '0.6rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, marginTop: 2 }}>
              Academic Portal
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.6)' : '#555', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/login"
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
              background: RED, color: 'white', textDecoration: 'none',
              boxShadow: `0 4px 14px ${RED}44`, transition: 'all 0.2s',
            }}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
        
        {/* Logo badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <SRIHERLogo size={72} />
        </div>

        {/* Pill tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 20, marginBottom: '1.5rem',
          background: isDark ? 'rgba(185,28,28,0.15)' : 'rgba(185,28,28,0.1)',
          border: `1px solid ${RED}44`, fontSize: '0.78rem', fontWeight: 700, color: RED_LT,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED_LT }} />
          Deemed to be University — Est. 1985
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1,
          color: isDark ? '#F8FAFC' : NAVY, marginBottom: '1rem', maxWidth: 780,
          letterSpacing: '-0.02em',
        }}>
          Sri Ramachandra Institute
          <span style={{ display: 'block', background: `linear-gradient(135deg, ${RED}, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            of Higher Education
          </span>
        </h1>

        <p style={{
          fontSize: '1.05rem', color: isDark ? 'rgba(255,255,255,0.55)' : '#4B5563',
          maxWidth: 580, lineHeight: 1.7, marginBottom: '2.5rem',
        }}>
          The official academic management portal for faculty, students, and administrators — attendance, assessments, substitutions, and more.
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 2rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
              background: `linear-gradient(135deg, ${RED}, #7F1D1D)`, color: 'white',
              textDecoration: 'none', boxShadow: `0 8px 24px ${RED}44`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${RED}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 8px 24px ${RED}44`; }}
          >
            Access Portal <ArrowRight size={16} />
          </Link>
          <Link
            to="/register/student"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 2rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,27,62,0.07)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(13,27,62,0.2)'}`,
              color: isDark ? '#F8FAFC' : NAVY, textDecoration: 'none', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,27,62,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,27,62,0.07)'; }}
          >
            Student / Faculty Registration
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center',
          marginTop: '3.5rem', paddingTop: '2.5rem',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          {[
            { value: '5000+', label: 'Students' },
            { value: '400+', label: 'Faculty' },
            { value: '30+', label: 'Departments' },
            { value: '40+', label: 'Years of Excellence' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: RED_LT, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: isDark ? 'rgba(255,255,255,0.45)' : '#6B7280', marginTop: '0.25rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Features ── */}
      <section style={{ padding: '4rem 2rem', position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: isDark ? '#F8FAFC' : NAVY, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            Everything you need, in one portal
          </h2>
          <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280', fontSize: '0.95rem' }}>
            Purpose-built modules for day-to-day academic operations
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              style={{
                padding: '1.75rem', borderRadius: 14,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                backdropFilter: 'blur(12px)', transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${color}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#F8FAFC' : NAVY, marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        margin: '0 2rem 4rem', padding: '3rem 2rem', borderRadius: 20, textAlign: 'center',
        background: `linear-gradient(135deg, ${RED}DD, #7F1D1D)`,
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            Log in with your institutional credentials issued by your administrator.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 2rem', borderRadius: 10, fontWeight: 700,
              background: 'white', color: RED, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            Login to Portal <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '1.5rem 2rem', textAlign: 'center',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        color: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF', fontSize: '0.8rem', zIndex: 1, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <SRIHERLogo size={20} />
        <span>© {new Date().getFullYear()} Sri Ramachandra Institute of Higher Education and Research (Deemed to be University). All rights reserved.</span>
      </footer>
    </div>
  );
};

export default LandingPage;
