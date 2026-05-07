import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssignment } from '../../api/assessmentApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, Loader2, Calendar } from 'lucide-react';

const AssignmentBuilder = () => {
  const navigate = useNavigate();
  const [classSections, setClassSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({
    title: '', description: '', instructions: '',
    classSectionId: '', courseId: '', maxMarks: 20,
    dueDate: '', allowResubmission: false,
    lateSubmission: { allowed: false, penaltyPercent: 10, maxLateDays: 3 },
    allowedFileTypes: ['pdf', 'docx', 'doc'],
    status: 'draft',
  });

  useEffect(() => {
    Promise.all([api.get('/academics/classes'), api.get('/academics/courses')])
      .then(([s, c]) => { setClassSections(s.data?.data || []); setCourses(c.data?.data || []); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (status = 'draft') => {
    if (!meta.title.trim()) return toast.error('Title is required');
    if (!meta.description.trim()) return toast.error('Description is required');
    if (!meta.classSectionId) return toast.error('Select a class section');
    if (!meta.courseId) return toast.error('Select a course');

    setSaving(true);
    try {
      await createAssignment({
        ...meta,
        classSection: meta.classSectionId,
        course: meta.courseId,
        dueDate: meta.dueDate || null,
        status,
      });
      toast.success(status === 'published' ? 'Assignment published!' : 'Assignment saved as draft');
      navigate('/assessments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const label = (text) => (
    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.4rem' }}>{text}</label>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button onClick={() => navigate('/assessments')} style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ padding: '0.55rem', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
            <FileText size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 className="page-title serif-heading">Create Assignment</h1>
            <p className="page-subtitle">Google Classroom–style assignment</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Assignment Details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            {label('Title')}
            <input value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))} placeholder="e.g. Lab Report — Week 5" />
          </div>

          <div>
            {label('Class Section')}
            <select value={meta.classSectionId} onChange={e => setMeta(m => ({ ...m, classSectionId: e.target.value }))}>
              <option value="">Select…</option>
              {classSections.map(s => <option key={s._id} value={s._id}>{s.section}</option>)}
            </select>
          </div>

          <div>
            {label('Course')}
            <select value={meta.courseId} onChange={e => setMeta(m => ({ ...m, courseId: e.target.value }))}>
              <option value="">Select…</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div>
            {label('Max Marks')}
            <input type="number" min="1" value={meta.maxMarks} onChange={e => setMeta(m => ({ ...m, maxMarks: parseInt(e.target.value) || 20 }))} />
          </div>

          <div>
            {label('Due Date (optional)')}
            <input type="datetime-local" value={meta.dueDate} onChange={e => setMeta(m => ({ ...m, dueDate: e.target.value }))} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            {label('Description')}
            <textarea rows={4} value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} placeholder="Describe the assignment requirements…" style={{ width: '100%', resize: 'vertical' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            {label('Instructions for Students')}
            <textarea rows={2} value={meta.instructions} onChange={e => setMeta(m => ({ ...m, instructions: e.target.value }))} placeholder="Any special instructions…" style={{ width: '100%', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={meta.allowResubmission} onChange={() => setMeta(m => ({ ...m, allowResubmission: !m.allowResubmission }))} />
            Allow Resubmission
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={meta.lateSubmission.allowed} onChange={() => setMeta(m => ({ ...m, lateSubmission: { ...m.lateSubmission, allowed: !m.lateSubmission.allowed } }))} />
            Allow Late Submission
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={() => handleSubmit('draft')} className="btn btn-secondary" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save as Draft
        </button>
        <button onClick={() => handleSubmit('published')} className="btn btn-accent" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />} Publish Assignment
        </button>
      </div>
    </div>
  );
};

export default AssignmentBuilder;
