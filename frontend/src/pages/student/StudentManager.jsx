import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { GraduationCap, Search, Layers, Loader2 } from 'lucide-react';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student');
      setStudents(res.data.data || []);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = `${s.user?.name} ${s.user?.email} ${s.studentId}`.toLowerCase();
    return q.includes(search.toLowerCase());
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Student Roster</h1>
          <p className="page-subtitle">View and manage enrolled students across all departments.</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--accent-muted)', border: '1px solid var(--border-accent)',
          padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
        }}>
          <GraduationCap size={14} /> {students.length} Total Students
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: 480 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by student name, email, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={28} className="animate-spin" color="var(--accent)" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading student records…</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={24} /></div>
            <h3>No Students Found</h3>
            <p>{search ? 'No students match your search term.' : 'No students have enrolled yet.'}</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID / Batch</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((profile, i) => (
                  <tr key={profile._id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-in">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: 'var(--status-info-bg)', border: '1px solid rgba(74,144,217,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--status-info)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                        }}>
                          {profile.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{profile.user?.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{profile.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                        <code style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'var(--accent-muted)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{profile.studentId}</code>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Batch {profile.batchYear}</p>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Layers size={13} /> {profile.department?.name || 'Undeclared'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-present">Enrolled</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
