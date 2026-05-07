import { useState, useEffect } from 'react';
import { createMeeting, getMeetings, deleteMeeting } from '../../api/assessmentApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Video, Plus, Trash2, Loader2, ExternalLink, Calendar } from 'lucide-react';

const MeetingScheduler = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const { user } = useAuth();
  const isFaculty = ['faculty', 'admin', 'superadmin'].includes(user?.role);
  const [form, setForm] = useState({
    title: '', description: '', meetingLink: '', scheduledAt: '', duration: 60, departmentId: '',
  });

  useEffect(() => {
    Promise.all([
      getMeetings().then(r => setMeetings(r.data?.data || r.data || [])),
      api.get('/academics/departments').then(r => setDepartments(r.data?.data || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.meetingLink.trim() || !form.scheduledAt) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await createMeeting(form);
      toast.success('Meeting scheduled!');
      setShowForm(false);
      setForm({ title: '', description: '', meetingLink: '', scheduledAt: '', duration: 60, departmentId: '' });
      const r = await getMeetings();
      setMeetings(r.data?.data || r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMeeting(id);
      setMeetings(m => m.filter(x => x._id !== id));
      toast.success('Meeting deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <Video size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Meetings</h1>
            <p className="page-subtitle">Schedule and manage online meetings</p>
          </div>
        </div>
        {isFaculty && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-accent" style={{ gap: '0.4rem' }}>
            <Plus size={15} /> Schedule Meeting
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>New Meeting</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Weekly Sync" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Meeting Link (Zoom/Meet/Teams)</label>
              <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} required placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Date & Time</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Duration (minutes)</label>
              <input type="number" min="15" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Department (optional)</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Description (optional)</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Agenda…" style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-accent" disabled={saving} style={{ gap: '0.4rem' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />} Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : meetings.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No meetings scheduled.</div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {meetings.map(m => {
            const scheduled = new Date(m.scheduledAt);
            const isPast = scheduled < new Date();
            return (
              <div key={m._id} className="card lift" style={{ padding: '1.25rem', opacity: isPast ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{m.title}</h4>
                  {isFaculty && (
                    <button onClick={() => handleDelete(m._id)} className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--text-tertiary)' }}><Trash2 size={14} /></button>
                  )}
                </div>
                {m.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{m.description}</p>}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <span><strong>When:</strong> {scheduled.toLocaleString()}</span>
                  <span><strong>Duration:</strong> {m.duration}min</span>
                </div>
                {m.department && <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>{m.department?.name || 'Dept'}</span>}
                <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <ExternalLink size={13} /> {isPast ? 'View Link' : 'Join Meeting'}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;
