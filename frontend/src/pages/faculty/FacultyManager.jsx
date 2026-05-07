import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, Search, BookOpen, Loader2, UserCheck } from 'lucide-react';

const FacultyManager = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchFacultyAndDepts = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/academics/departments')
      ]);
      setFaculty(facRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFacultyAndDepts(); }, []);

  const handleApprove = async (profileId) => {
    try {
      await api.put(`/faculty/${profileId}/approve`);
      toast.success('Faculty approved!');
      setFaculty(faculty.map(f => f._id === profileId ? { ...f, status: 'approved', user: { ...f.user, isApproved: true } } : f));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleAssignDept = async (userId, deptId) => {
    try {
      await api.put(`/faculty/${userId}/department`, { departmentId: deptId });
      toast.success('Department assigned!');
      setFaculty(faculty.map(f => f.user?._id === userId ? { ...f, department: departments.find(d => d._id === deptId) || null } : f));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign department');
    }
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const searchString = `${f.user?.name} ${f.user?.email} ${f.department?.name}`.toLowerCase();
    return matchesStatus && searchString.includes(search.toLowerCase());
  });

  const pendingCount = faculty.filter(f => f.status === 'pending').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Faculty Directory</h1>
          <p className="page-subtitle">Manage teaching staff and department assignments.</p>
        </div>
        {pendingCount > 0 && (
          <div className="badge badge-warning animate-pulse" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: 'var(--radius-md)' }}>
            <Clock size={13} /> {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name, email, or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ flex: '0 0 180px' }}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Active</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={28} className="animate-spin" color="var(--accent)" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading faculty data…</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={24} /></div>
            <h3>No Faculty Found</h3>
            <p>{search || statusFilter !== 'all' ? 'No faculty members match your current filters.' : 'No faculty have registered yet.'}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }} className="stagger-children">
          {filteredFaculty.map(profile => (
            <div key={profile._id} className="card lift" style={{ overflow: 'hidden' }}>
              {/* Status bar top */}
              <div style={{ height: 3, background: profile.status === 'approved' ? 'var(--status-present)' : 'var(--status-late)' }} />
              <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'var(--accent-muted)', border: '1px solid var(--border-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', fontWeight: 700, fontSize: '1rem',
                    }}>
                      {profile.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{profile.user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{profile.designation || 'Faculty'}</p>
                    </div>
                  </div>
                  <span className={`badge ${profile.status === 'approved' ? 'badge-present' : 'badge-warning'}`}>
                    {profile.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 64 }}>Email</span>
                    <span style={{ color: 'var(--text-primary)' }}>{profile.user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 64 }}>Faculty ID</span>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-muted)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{profile.facultyId}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 64 }}>Dept</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      <BookOpen size={11} /> 
                      <select 
                        value={profile.department?._id || profile.department || ''}
                        onChange={(e) => handleAssignDept(profile.user?._id, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, appearance: 'auto' }}
                      >
                        <option value="">Unassigned</option>
                        {departments.map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </span>
                  </div>
                </div>

                {profile.status === 'pending' && (
                  <button onClick={() => handleApprove(profile._id)} className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}>
                    <UserCheck size={14} /> Approve Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyManager;
