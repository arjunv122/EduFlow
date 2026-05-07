import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAnnouncements, createAnnouncement } from '../../api/announcementApi';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, X, Loader2, Clock, ChevronDown,
  AlertTriangle, Info, Zap, MessageSquare
} from 'lucide-react';

const priorityConfig = {
  low:    { label: 'Low',    colorVar: 'var(--text-tertiary)',    bgStyle: { background: 'var(--bg-tertiary)', border: '1px solid var(--border)' },           icon: Info },
  normal: { label: 'Normal', colorVar: 'var(--status-info)',      bgStyle: { background: 'var(--status-info-bg)', border: '1px solid rgba(74,144,217,0.3)' },   icon: MessageSquare },
  high:   { label: 'High',   colorVar: 'var(--status-warning)',   bgStyle: { background: 'var(--status-warning-bg)', border: '1px solid rgba(232,160,32,0.3)' }, icon: AlertTriangle },
  urgent: { label: 'Urgent', colorVar: 'var(--status-absent)',    bgStyle: { background: 'var(--status-absent-bg)', border: '1px solid rgba(234,67,53,0.3)' },   icon: Zap },
};

const AnnouncementCard = ({ announcement }) => {
  const cfg = priorityConfig[announcement.priority] || priorityConfig.normal;
  const Icon = cfg.icon;
  const date = new Date(announcement.createdAt);

  return (
    <div className="card animate-fade-in" style={{ ...cfg.bgStyle, padding: '1.1rem 1.25rem', transition: 'all var(--transition)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{ padding: '0.45rem', borderRadius: 8, flexShrink: 0, ...cfg.bgStyle, display: 'flex' }}>
          <Icon size={15} style={{ color: cfg.colorVar }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.colorVar }}>{cfg.label}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>·</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{announcement.audience}</span>
          </div>
          <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>{announcement.title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
          <Clock size={11} />
          <span>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.75rem', paddingLeft: '2.25rem' }}>{announcement.content}</p>

      <div style={{ paddingLeft: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.625rem' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--status-info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', fontSize: '0.65rem', fontWeight: 700 }}>
          {announcement.createdBy?.name?.[0] || '?'}
        </div>
        <span>{announcement.createdBy?.name || 'Unknown'} <span style={{ textTransform: 'capitalize' }}>({announcement.createdBy?.role})</span></span>
      </div>
    </div>
  );
};

// Create Announcement Modal
const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    audience: 'institution',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required.');
    setSaving(true);
    try {
      await createAnnouncement(form);
      toast.success('Announcement published!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 520, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>New Announcement</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label>Title *</label>
            <input type="text" placeholder="Announcement title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-field">
            <label>Content *</label>
            <textarea rows={4} placeholder="Announcement details…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-field">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-field">
              <label>Audience</label>
              <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                <option value="institution">Whole Institution</option>
                <option value="department">Department</option>
                <option value="class">Class</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button id="publish-announcement-btn" type="submit" disabled={saving} className="btn btn-accent" style={{ gap: '0.4rem' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
              {saving ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const canCreate = ['admin', 'faculty'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data?.data || []);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    filter === 'all'
      ? announcements
      : announcements.filter((a) => a.priority === filter);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--status-warning-bg)', border: '1px solid rgba(232,160,32,0.3)', display: 'flex' }}>
            <Megaphone size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Announcements</h1>
            <p className="page-subtitle">Institution-wide notices and updates</p>
          </div>
        </div>
        {canCreate && (
          <button id="new-announcement-btn" onClick={() => setShowModal(true)} className="btn btn-accent" style={{ gap: '0.4rem' }}>
            <Plus size={14} /> New Announcement
          </button>
        )}
      </div>

      {/* Priority filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['all', 'urgent', 'high', 'normal', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            style={{
              fontSize: '0.72rem', padding: '0.3rem 0.875rem',
              borderRadius: 20, border: '1px solid',
              fontWeight: 600, textTransform: 'capitalize',
              transition: 'all var(--transition)',
              background: filter === p ? 'var(--accent)' : 'var(--bg-tertiary)',
              borderColor: filter === p ? 'var(--accent)' : 'var(--border)',
              color: filter === p ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            {p === 'all' ? 'All' : p}
            {p !== 'all' && <span style={{ marginLeft: 6, opacity: 0.7 }}>({announcements.filter(a => a.priority === p).length})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={28} className="animate-spin" color="var(--accent)" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Loading announcements…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Megaphone size={22} /></div>
            <h3>No Announcements</h3>
            <p>{filter === 'all' ? 'No announcements have been posted yet.' : `No ${filter} priority announcements.`}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="stagger-children">
          {filtered.map(a => <AnnouncementCard key={a._id} announcement={a} />)}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
};

export default AnnouncementsPage;
