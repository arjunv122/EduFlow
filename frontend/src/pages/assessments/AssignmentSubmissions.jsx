import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissions, gradeSubmission } from '../../api/assessmentApi';
import toast from 'react-hot-toast';
import { Users, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

const AssignmentSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null); // submissionId being graded
  const [gradeInput, setGradeInput] = useState({ marks: '', feedback: '' });

  useEffect(() => {
    getSubmissions(id)
      .then(r => setSubmissions(r.data?.data || r.data || []))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGrade = async (submissionId) => {
    if (!gradeInput.marks) return toast.error('Enter marks');
    try {
      await gradeSubmission(submissionId, parseFloat(gradeInput.marks), gradeInput.feedback);
      toast.success('Graded successfully');
      setGrading(null);
      setGradeInput({ marks: '', feedback: '' });
      // Refresh
      const r = await getSubmissions(id);
      setSubmissions(r.data?.data || r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ padding: '0.55rem', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex' }}>
          <Users size={20} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title serif-heading">Submissions</h1>
          <p className="page-subtitle">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No submissions yet.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Submitted At</th>
                  <th>Late?</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => (
                  <tr key={sub._id}>
                    <td style={{ color: 'var(--text-tertiary)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{sub.student?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}</td>
                    <td>
                      {sub.isLate ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          <AlertTriangle size={10} /> {sub.lateDays}d late
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--status-present)' }}>On time</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${sub.status === 'graded' ? 'badge-present' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      {sub.status === 'graded' ? (
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{sub.marksAwarded}</span>
                      ) : '—'}
                    </td>
                    <td>
                      {grading === sub._id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input type="number" placeholder="Marks" value={gradeInput.marks} onChange={e => setGradeInput(g => ({ ...g, marks: e.target.value }))} style={{ width: 60, padding: '0.3rem 0.5rem' }} />
                          <input type="text" placeholder="Feedback" value={gradeInput.feedback} onChange={e => setGradeInput(g => ({ ...g, feedback: e.target.value }))} style={{ width: 120, padding: '0.3rem 0.5rem' }} />
                          <button onClick={() => handleGrade(sub._id)} className="btn btn-accent" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Save</button>
                          <button onClick={() => setGrading(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setGrading(sub._id); setGradeInput({ marks: sub.marksAwarded || '', feedback: sub.feedback || '' }); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          {sub.status === 'graded' ? 'Re-grade' : 'Grade'}
                        </button>
                      )}
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

export default AssignmentSubmissions;
