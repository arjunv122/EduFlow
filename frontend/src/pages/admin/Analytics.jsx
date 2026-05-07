import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Users, ClipboardCheck, HelpCircle, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

const KPICard = ({ icon: Icon, label, value, sub, accentColor = 'var(--accent)' }) => (
  <div className="kpi-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <Icon size={16} style={{ color: accentColor, opacity: 0.7 }} />
    </div>
    <div className="kpi-value">{value ?? '—'}</div>
    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</p>}
  </div>
);

const CHART_COLORS = ['#E8A020', '#4A90D9', '#34A853', '#EA4335', '#9B59B6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.value}{p.unit || ''}</p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { user } = useAuth();
  const [dynamicStats, setDynamicStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalCourses: 0,
  });
  const [deptAttendance, setDeptAttendance] = useState([]);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, facultyRes, deptsRes, deptsCall] = await Promise.all([
          api.get('/student').catch(() => ({ data: { data: [] } })),
          api.get('/faculty').catch(() => ({ data: { data: [] } })),
          api.get('/academics/departments').catch(() => ({ data: { data: [] } })),
          api.get('/academics/departments').catch(() => ({ data: { data: [] } }))
        ]);

        setDynamicStats({
          totalStudents: studentsRes.data?.data?.length || 0,
          totalFaculty: facultyRes.data?.data?.length || 0,
          totalDepartments: deptsRes.data?.data?.length || 0,
          totalCourses: 0,
        });

        const depts = deptsCall.data?.data || [];
        // Mock attendance data per dept for now (real pipeline in Sprint 2)
        setDeptAttendance(depts.map((d, i) => ({
          name: d.code || d.name.slice(0, 6),
          attendance: Math.round(65 + Math.random() * 30),
        })));

        // Mock 4-week score trend
        setScoreTrend([
          { week: 'Week 1', avgScore: 58 },
          { week: 'Week 2', avgScore: 63 },
          { week: 'Week 3', avgScore: 71 },
          { week: 'Week 4', avgScore: 68 },
        ]);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Analytics</h1>
          <p className="page-subtitle">Institution-wide performance metrics</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KPICard icon={Users} label="Total Students" value={dynamicStats.totalStudents} sub="+2% this month" accentColor="#4A90D9" />
        <KPICard icon={Users} label="Faculty & Staff" value={dynamicStats.totalFaculty} sub="100% onboarded" accentColor="#9B59B6" />
        <KPICard icon={BookOpen} label="Total Departments" value={dynamicStats.totalDepartments} sub="Active" accentColor="#34A853" />
        <KPICard icon={ClipboardCheck} label="Avg. Attendance" value="—" sub="No data yet" accentColor="#E8A020" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Department Attendance Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Attendance by Department</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading…</div>
            ) : deptAttendance.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No department data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptAttendance} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="attendance" radius={[3, 3, 0, 0]}>
                    {deptAttendance.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.attendance >= 75 ? 'var(--status-present)' : entry.attendance >= 60 ? 'var(--accent)' : 'var(--status-absent)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quiz Score Trend Line Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Quiz Score Trend (Last 4 Weeks)</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="avgScore" stroke="var(--accent)"
                  strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 5, fill: 'var(--accent-hover)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
        <TrendingUp size={15} />
        <span>Live aggregation pipelines and real-time charts are planned for <strong>Sprint 3</strong>. Current data uses institution stats and sample values.</span>
      </div>
    </div>
  );
};

export default Analytics;
