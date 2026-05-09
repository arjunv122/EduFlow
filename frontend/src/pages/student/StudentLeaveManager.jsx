import { useState, useEffect, useRef } from 'react';
import { applyStudentLeave, getMyLeaves, uploadMedicalDocument } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle2, Clock, XCircle, Loader2, Send,
  Upload, FileText, Stethoscope, AlertTriangle, Plus,
} from 'lucide-react';

// Check if date is Sunday
const isSunday = (d) => new Date(d).getDay() === 0;
// Check if date is 2nd Saturday of its month
const isSecondSaturday = (d) => {
  const date = new Date(d);
  if (date.getDay() !== 6) return false;
  const day = date.getDate();
  return day >= 8 && day <= 14;
};

// Count working days (excludes Sundays and 2nd Saturdays)
const countWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (!isSunday(current) && !isSecondSaturday(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const LEAVE_TYPES = [
  { value: 'personal',  label: 'Personal',  color: '#6366f1' },
  { value: 'medical',   label: 'Medical',   color: '#ef4444' },
  { value: 'family',    label: 'Family',    color: '#f59e0b' },
  { value: 'academic',  label: 'Academic',  color: '#10b981' },
  { value: 'other',     label: 'Other',     color: '#8b5cf6' },
];

const statusStyle = (s) => ({
  approved: { color: 'var(--status-present)', bg: 'var(--status-present-bg)' },
  rejected: { color: 'var(--status-absent)', bg: 'var(--status-absent-bg)' },
  pending:  { color: 'var(--accent)',         bg: 'rgba(66,133,244,0.1)' },
}[s] || { color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' });

const StudentLeaveManager = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', leaveType: 'personal' });
  const [dateError, setDateError] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [docFile, setDocFile] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const uploadRef = useRef();

  const loadLeaves = async () => {
    try {
      const r = await getMyLeaves();
      const data = r.data;
      // sendSuccess spreads arrays into data, or data field
      setLeaves(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    loadLeaves().finally(() => setLoading(false));
  }, []);

  // Validate date range
  useEffect(() => {
    if (!form.startDate || !form.endDate) { setDateError(''); return; }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const blocked = [];
    const current = new Date(start);
    while (current <= end) {
      if (isSunday(current)) blocked.push(`${current.toLocaleDateString()} (Sunday)`);
      if (isSecondSaturday(current)) blocked.push(`${current.toLocaleDateString()} (2nd Saturday)`);
      current.setDate(current.getDate() + 1);
    }
    setDateError(blocked.length > 0 ? `Blocked dates: ${blocked.join(', ')}` : '');
  }, [form.startDate, form.endDate]);

  // Convert file to base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dateError) return toast.error('Fix blocked dates before submitting');
    if (!form.reason.trim()) return toast.error('Reason is required');
    setSubmitting(true);
    try {
      let documentUrl = null;
      let documentName = null;

      // If medical and a doc is attached, convert to base64
      if (form.leaveType === 'medical' && docFile) {
        documentUrl = await fileToBase64(docFile);
        documentName = docFile.name;
      }

      const payload = { ...form };
      if (documentUrl) { payload.documentUrl = documentUrl; payload.documentName = documentName; }

      await applyStudentLeave(payload);
      toast.success('Leave request submitted!');
      setForm({ startDate: '', endDate: '', reason: '', leaveType: 'personal' });
      setDocFile(null);
      await loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocUpload = async (leaveId) => {
    if (!uploadFile) return toast.error('Please select a document file');
    setUploadingFor(leaveId);
    try {
      const base64 = await fileToBase64(uploadFile);
      await uploadMedicalDocument(leaveId, base64, uploadFile.name);
      toast.success('Medical document uploaded!');
      setUploadFile(null);
      setUploadingFor(null);
      await loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  const workingDays = countWorkingDays(form.startDate, form.endDate);
  const isMedical = form.leaveType === 'medical';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <Calendar size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">My Leaves</h1>
            <p className="page-subtitle">Apply for leave and track your requests</p>
          </div>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn btn-secondary" style={{ gap: '0.4rem', fontSize: '0.82rem' }}>
          <Plus size={14} /> {showForm ? 'Hide Form' : 'Apply Leave'}
        </button>
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Apply for Leave</h3>

          {/* Leave type selector */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {LEAVE_TYPES.map(lt => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, leaveType: lt.value }))}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                  border: `2px solid ${form.leaveType === lt.value ? lt.color : 'var(--border)'}`,
                  background: form.leaveType === lt.value ? `${lt.color}20` : 'transparent',
                  color: form.leaveType === lt.value ? lt.color : 'var(--text-tertiary)',
                  cursor: 'pointer', transition: 'all 150ms ease',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}
              >
                {lt.value === 'medical' && <Stethoscope size={12} />}
                {lt.label}
              </button>
            ))}
          </div>

          {/* Medical note */}
          {isMedical && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Stethoscope size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#ef4444' }}>Medical Leave</strong> — You can apply now and upload your medical certificate later.
                Medical leaves can be applied for <strong>past dates</strong>. HOD approval required.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Start Date {isMedical && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>(Past dates allowed)</span>}</label>
              <input type="date" required value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                max={isMedical ? new Date().toISOString().split('T')[0] : undefined}
                min={isMedical ? undefined : new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" required value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                min={form.startDate || (isMedical ? undefined : new Date().toISOString().split('T')[0])}
                max={isMedical ? new Date().toISOString().split('T')[0] : undefined}
              />
            </div>

            {/* Working days preview */}
            {form.startDate && form.endDate && !dateError && (
              <div style={{ gridColumn: '1 / -1', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Calendar size={14} color="var(--accent)" />
                <strong style={{ color: 'var(--accent)' }}>{workingDays} working day{workingDays !== 1 ? 's' : ''}</strong>
                &nbsp;of leave selected
              </div>
            )}

            {dateError && (
              <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.75rem', background: 'var(--status-absent-bg)', border: '1px solid rgba(234,67,53,0.2)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--status-absent)', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {dateError}
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Reason</label>
              <textarea rows={3} required value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Briefly explain the reason…"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Medical document upload (optional at apply time) */}
            {isMedical && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Medical Document <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional — you can upload later)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1.5px dashed var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', flex: 1 }}>
                    <Upload size={14} color="var(--accent)" />
                    {docFile ? docFile.name : 'Click to select certificate / prescription'}
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setDocFile(e.target.files[0] || null)} />
                  </label>
                  {docFile && <button type="button" onClick={() => setDocFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-absent)', fontSize: '0.78rem' }}>✕ Remove</button>}
                </div>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-accent" disabled={submitting || !!dateError} style={{ gap: '0.4rem' }}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Submitting…' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave History */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Leave History</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No leave requests yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {leaves.map((l, idx) => {
              const st = statusStyle(l.status);
              const ltColor = LEAVE_TYPES.find(t => t.value === l.leaveType)?.color || '#6366f1';
              const needsDoc = l.leaveType === 'medical' && !l.medicalDocument && l.status === 'pending';
              return (
                <div key={l._id} style={{ padding: '1.25rem 1.5rem', borderBottom: idx < leaves.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: 20, border: `1.5px solid ${ltColor}`, color: ltColor }}>{l.leaveType}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{l.reason}</p>
                      {l.remarks && <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>Remarks: {l.remarks}</p>}
                      {l.reviewedBy?.name && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Reviewed by: {l.reviewedBy.name}</p>}
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', background: st.bg, color: st.color }}>
                      {l.status === 'approved' && <CheckCircle2 size={12} />}
                      {l.status === 'rejected' && <XCircle size={12} />}
                      {l.status === 'pending' && <Clock size={12} />}
                      {l.status}
                    </span>
                  </div>

                  {/* Medical doc status */}
                  {l.leaveType === 'medical' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {l.medicalDocument ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--status-present)' }}>
                          <FileText size={13} /> Document uploaded: {l.medicalDocumentName || 'Medical Certificate'}
                          <a href={l.medicalDocument} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.75rem', marginLeft: 4 }}>View</a>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {needsDoc && (
                            <span style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <AlertTriangle size={12} /> No document uploaded yet
                            </span>
                          )}
                          {l.status !== 'rejected' && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--accent)', cursor: 'pointer', padding: '0.3rem 0.7rem', border: '1px solid var(--accent)', borderRadius: 6, background: 'transparent' }}>
                              <Upload size={12} /> Upload Document
                              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                                onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]); uploadRef.current = l._id; }}
                              />
                            </label>
                          )}
                          {uploadFile && uploadRef.current === l._id && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{uploadFile.name}</span>
                              <button className="btn btn-accent" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                onClick={() => handleDocUpload(l._id)} disabled={uploadingFor === l._id}>
                                {uploadingFor === l._id ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                                {uploadingFor === l._id ? 'Uploading…' : 'Submit Document'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLeaveManager;
