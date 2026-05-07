import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';

const InstitutionSettings = () => {
  const { user } = useAuth();
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'Asia/Kolkata',
    academicYearStart: '',
    academicYearEnd: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // If the user is an admin, their institution is already fully populated via /auth/me
        if (user?.institution && user.institution.name) {
          const data = user.institution;
          setInst(data);
          setForm({
            name: data.name || '',
            email: data.contactEmail || data.email || '',
            phone: data.contactPhone || data.phone || '',
            timezone: data.settings?.timezone || 'Asia/Kolkata',
            academicYearStart: data.settings?.academicYearStart || '',
            academicYearEnd: data.settings?.academicYearEnd || '',
          });
          setLoading(false);
          return;
        }

        // Otherwise (for superadmins), fetch it via the API
        const instId = user?.institution?._id || user?.institution || localStorage.getItem('activeInstitutionId');
        if (!instId || instId === 'undefined') {
          toast.error('No active institution context found');
          setLoading(false);
          return;
        }
        
        const res = await api.get(`/governance/${instId}`);
        const data = res.data.data;
        setInst(data);
        setForm({
          name: data.name || '',
          email: data.contactEmail || data.email || '',
          phone: data.contactPhone || data.phone || '',
          timezone: data.settings?.timezone || 'Asia/Kolkata',
          academicYearStart: data.settings?.academicYearStart || '',
          academicYearEnd: data.settings?.academicYearEnd || '',
        });
      } catch (err) {
        toast.error('Failed to load institution data. You might lack permissions.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [dangerConfirm, setDangerConfirm] = useState('');

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin mx-auto" /></div>;
  }

  if (!inst) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>No institution context selected. Please log out and back in.</div>;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/governance/${inst._id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        timezone: form.timezone,
        settings: {
          academicYearStart: form.academicYearStart,
          academicYearEnd:   form.academicYearEnd,
        },
      });
      toast.success('Settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (dangerConfirm !== inst.name) {
      toast.error('Institution name does not match. Re-type to confirm.');
      return;
    }
    if (!window.confirm('This will deactivate the entire institution. Are you absolutely sure?')) return;
    try {
      await api.put(`/governance/institutions/${inst._id}/status`, { status: 'inactive' });
      toast.success('Institution deactivated. Contact support to restore.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
    'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
    'UTC'
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 860 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title serif-heading">Institution Settings</h1>
          <p className="page-subtitle">{inst.name || 'Your institution'} · {inst._id}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left — General settings */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>General Information</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label>Institution Display Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="card-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Academic Calendar</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label>Timezone</label>
                <select
                  value={form.timezone}
                  onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                  style={{ appearance: 'none' }}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-field">
                  <label>Academic Year Start</label>
                  <input
                    type="date"
                    value={form.academicYearStart}
                    onChange={e => setForm(f => ({ ...f, academicYearStart: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label>Academic Year End</label>
                  <input
                    type="date"
                    value={form.academicYearEnd}
                    onChange={e => setForm(f => ({ ...f, academicYearEnd: e.target.value }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                style={{ gap: '0.4rem', alignSelf: 'flex-start', marginTop: '0.25rem' }}
                disabled={saving}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Right — Danger zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Approved status callout */}
          <div className="card">
            <div className="card-body">
              <p className="kpi-label" style={{ marginBottom: '0.25rem' }}>Institution ID</p>
              <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'block', wordBreak: 'break-all' }}>
                {inst._id}
              </code>
              <hr className="divider" />
              <p className="kpi-label" style={{ marginBottom: '0.25rem' }}>Status</p>
              <span className={`badge ${inst.status === 'approved' ? 'badge-present' : 'badge-absent'}`}>
                {inst.status || 'unknown'}
              </span>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card-danger">
            <div className="card-header" style={{ borderColor: 'var(--danger-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--danger)' }}>Danger Zone</h3>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Deactivate Institution</strong>
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  This will lock all user accounts and suspend all academic operations. This action requires contacting support to reverse.
                </p>
                <div className="form-field" style={{ marginBottom: '0.75rem' }}>
                  <label style={{ color: 'var(--danger)' }}>Type institution name to confirm</label>
                  <input
                    type="text"
                    placeholder={inst.name}
                    value={dangerConfirm}
                    onChange={e => setDangerConfirm(e.target.value)}
                    style={{ borderColor: 'var(--danger-border)' }}
                  />
                </div>
                <button
                  className="btn btn-danger"
                  style={{ gap: '0.4rem', width: '100%', justifyContent: 'center' }}
                  onClick={handleDeactivate}
                  disabled={dangerConfirm !== inst.name}
                >
                  <AlertTriangle size={13} />
                  Deactivate Institution
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionSettings;
