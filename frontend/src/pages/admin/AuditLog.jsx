import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Download, Filter, RefreshCw, Loader2, ShieldAlert } from 'lucide-react';

const ACTION_BADGE_COLOR = {
  'attendance.submit': 'badge-present',
  'quiz.publish':      'badge-info',
  'user.deactivate':   'badge-absent',
  'user.reactivate':   'badge-present',
  'institution.settings.update': 'badge-warning',
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', action: '' });
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.action && { action: filters.action }),
      };
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data?.data || []);
      setPagination(res.data?.pagination || {});
    } catch { toast.error('Failed to load audit logs.'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'IP Address'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.actor?.name,
      l.actor?.role,
      l.action,
      l.entity?.label || l.entity?.type || '',
      l.ipAddress,
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Audit Log</h1>
          <p className="page-subtitle">Immutable record of all system actions — read only</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={loadLogs} style={{ padding: '0.55rem' }} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-secondary" onClick={exportCSV} style={{ gap: '0.4rem' }} disabled={!logs.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Immutability notice */}
      <div className="alert alert-info">
        <ShieldAlert size={14} />
        <span>This log is <strong>append-only and immutable</strong>. No entries may be edited or deleted.</span>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: '1 1 140px' }}>
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="form-field" style={{ flex: '1 1 140px' }}>
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="form-field" style={{ flex: '1 1 200px' }}>
            <label>Action Contains</label>
            <input
              type="text"
              placeholder="e.g. attendance.submit"
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            />
          </div>
          <button
            className="btn btn-accent"
            onClick={() => { setPage(1); loadLogs(); }}
            style={{ gap: '0.4rem', alignSelf: 'flex-end' }}
          >
            <Filter size={13} /> Apply
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => { setFilters({ startDate: '', endDate: '', action: '' }); setPage(1); }}
            style={{ alignSelf: 'flex-end' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No audit log entries found.
                  </td>
                </tr>
              ) : logs.map(log => {
                const badgeCls = ACTION_BADGE_COLOR[log.action] || 'badge-neutral';
                return (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.actor?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                        {log.actor?.role}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeCls}`} style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {log.entity?.label ? (
                        <span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>{log.entity.type} · </span>
                          {log.entity.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
              >
                ← Prev
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
