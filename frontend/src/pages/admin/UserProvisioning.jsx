import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Users, Upload, UserX, UserCheck, ChevronDown,
  Loader2, Search, RefreshCw, ShieldCheck, Trash2
} from 'lucide-react';
import PreApprovedRegistry from './PreApprovedRegistry';

const ROLE_BADGE = {
  admin:    { label: 'Admin',   cls: 'badge-warning' },
  faculty:  { label: 'Faculty', cls: 'badge-info' },
  student:  { label: 'Student', cls: 'badge-neutral' },
  superadmin: { label: 'Superadmin', cls: 'badge-absent' },
};

const UserProvisioning = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'whitelist'
  const fileRef = useRef();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { role: roleFilter || undefined } });
      setUsers(res.data?.data || []);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user? They will not be able to log in.')) return;
    try {
      await api.put(`/users/${id}/deactivate`);
      toast.success('User deactivated');
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to deactivate');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to completely delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('Activate this user and automatically send credentials to their email?')) return;
    try {
      await api.patch(`/users/${userId}/activate`);
      toast.success('User activated and credentials secretly dispatched');
      setUsers(u => u.map(x => x._id === userId ? { ...x, isActive: true } : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Activation failed.'); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      setUsers(u => u.map(x => x._id === userId ? { ...x, role: newRole } : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Role change failed.'); }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      }).filter(r => r.name || r.email);

      const res = await api.post('/users/bulk-import', { rows });
      setImportResult(res.data);
      toast.success(`Import complete: ${res.data.created} created`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">User Accounts</h1>
          <p className="page-subtitle">Manage all institution users — roles, access, and bulk onboarding</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="file"
            accept=".csv"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={handleCSVImport}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            style={{ gap: '0.4rem' }}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Importing…' : 'Bulk CSV Import'}
          </button>
          <button className="btn btn-secondary" onClick={loadUsers} style={{ padding: '0.55rem' }} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="alert alert-success">
          <span>✓ Import complete — <strong>{importResult.created}</strong> created, <strong>{importResult.skipped}</strong> skipped.</span>
          {importResult.errors?.length > 0 && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--status-absent)' }}>
              {importResult.errors.length} error(s).
            </span>
          )}
        </div>
      )}

      {/* CSV format hint */}
      <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>
        <span>CSV format: <code style={{ background: 'var(--bg-tertiary)', padding: '0 4px', borderRadius: 3 }}>name, email, studentId, batchYear, departmentId</code> — header row required.</span>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
        <div 
          onClick={() => setActiveTab('directory')}
          style={{ 
            padding: '0 0 0.75rem 0', cursor: 'pointer', fontWeight: 500,
            color: activeTab === 'directory' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'directory' ? '2px solid var(--accent)' : '2px solid transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> User Directory
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('whitelist')}
          style={{ 
            padding: '0 0 0.75rem 0', cursor: 'pointer', fontWeight: 500,
            color: activeTab === 'whitelist' ? 'var(--status-warning)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'whitelist' ? '2px solid var(--status-warning)' : '2px solid transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} /> Pre-Approved Whitelist
          </div>
        </div>
      </div>

      {activeTab === 'whitelist' ? (
        <PreApprovedRegistry />
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ appearance: 'none', paddingRight: '2rem', minWidth: 140 }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No users found.
                  </td>
                </tr>
              ) : filtered.map(u => {
                const badge = ROLE_BADGE[u.role] || ROLE_BADGE.student;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--accent-muted)', border: '1px solid var(--border-accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-present' : 'badge-warning'}`}>
                        {u.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Role change */}
                        <div style={{ position: 'relative' }}>
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            style={{
                              fontSize: '0.75rem', padding: '0.25rem 1.5rem 0.25rem 0.5rem',
                              appearance: 'none', minWidth: 80,
                            }}
                            disabled={u.role === 'superadmin'}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown size={10} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
                        </div>
                        {/* Admin Action */}
                        {!u.isActive ? (
                          <button
                            className="btn"
                            style={{ 
                              padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', 
                              backgroundColor: 'var(--status-warning)', color: '#1C2333', border: '1px solid var(--status-warning)' 
                            }}
                            onClick={() => handleActivate(u._id)}
                            disabled={u.role === 'superadmin'}
                            title="Generate and send credentials"
                          >
                            <UserCheck size={12} /> Activate & Send Credentials
                          </button>
                        ) : (
                          <button
                            className="btn"
                            style={{ 
                              padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', 
                              backgroundColor: 'transparent', color: 'var(--status-absent)', border: '1px solid var(--status-absent)' 
                            }}
                            onClick={() => handleDeactivate(u._id)}
                            disabled={u.role === 'superadmin'}
                            title="Deactivate User"
                          >
                            <UserX size={12} /> Deactivate
                          </button>
                        )}
                        <button
                          className="btn"
                          style={{ 
                            padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                            backgroundColor: 'transparent', color: 'var(--status-absent)', border: '1px solid transparent' 
                          }}
                          onClick={() => handleDelete(u._id)}
                          disabled={u.role === 'superadmin' || u.role === 'admin'}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default UserProvisioning;
